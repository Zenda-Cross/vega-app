import * as RNFS from '@dr.pogodin/react-native-fs';
import axios from 'axios';
import {DownloadPausedError} from './downloadBackends/types';
import {NativeModules} from 'react-native';

interface NativeFileFetcher {
  fetchToFile(
    tag: string,
    url: string,
    path: string,
    headers: Record<string, string>,
  ): Promise<{statusCode: number}>;
  cancelFetches(tag: string): void;
  finalizeHls(
    videoPlaylistPath: string,
    audioPlaylistPath: string | null,
    outputPath: string,
  ): Promise<{duration: number}>;
}

// Segments go through the app's OkHttp client so DNS over HTTPS, WARP and
// ByeDPI apply to them, as they do to the playlist. RNFS.downloadFile uses
// HttpURLConnection, which skips all three.
const nativeFetcher = NativeModules.HttpDownloadModule as
  | Partial<NativeFileFetcher>
  | undefined;
const canFetchNatively =
  typeof nativeFetcher?.fetchToFile === 'function' &&
  typeof nativeFetcher?.cancelFetches === 'function';
const canFinalizeHls = typeof nativeFetcher?.finalizeHls === 'function';

interface SegmentInfo {
  duration: number;
  url: string;
  index: number;
  discontinuity: boolean;
  initSegmentUrl?: string;
}

interface M3U8Data {
  segments: SegmentInfo[];
  initSegmentUrl?: string;
  totalDuration: number;
  isLive: boolean;
  mediaSequence?: number;
  // Separate audio rendition of the chosen variant (#EXT-X-MEDIA TYPE=AUDIO).
  audio?: M3U8Data;
}

/** Reads one attribute from an HLS tag line, quoted or not. */
const tagAttribute = (line: string, name: string): string | undefined => {
  const match = line.match(new RegExp(`[:,]${name}=("([^"]*)"|[^,]*)`));
  return match ? (match[2] ?? match[1]) : undefined;
};

const MAX_SEGMENT_ATTEMPTS = 5;
const SEGMENT_RETRY_BASE_MS = 1000;
const MAX_SEGMENT_RETRY_MS = 16000;

class SegmentHttpError extends Error {
  constructor(readonly status: number) {
    super(`Segment download failed with HTTP status ${status}`);
  }
}

const cancelledDownloads = new Set<string>();
const activeDownloads = new Set<string>();
const pausedDownloads = new Set<string>();
const finalizingDownloads = new Set<string>();
const liveDownloads = new Set<string>();
const completion = new Map<string, Promise<void>>();
const fallbackJobs = new Map<string, Set<number>>();
const playlistRequests = new Map<string, AbortController>();
const retryWaits = new Map<string, Set<() => void>>();
const retrySleep = (id: string, ms: number) => new Promise<void>(resolve => {
  const waits = retryWaits.get(id) || new Set<() => void>();
  retryWaits.set(id, waits);
  const finish = () => {clearTimeout(timer); waits.delete(finish); resolve();};
  const timer = setTimeout(finish, ms);
  waits.add(finish);
});
const assertRunning = (id: string) => {
  if (cancelledDownloads.has(id)) throw new Error('Download cancelled');
  if (pausedDownloads.has(id)) throw new DownloadPausedError();
};
const stopTransfers = (id: string) => {
  playlistRequests.get(id)?.abort();
  for (const wake of retryWaits.get(id) || []) wake();
  if (canFetchNatively) nativeFetcher!.cancelFetches!(id);
  for (const job of fallbackJobs.get(id) || []) RNFS.stopDownload(job);
};

interface HlsCheckpoint {version: 1; identity: string; finalizedSize?: number}
const fileSize = async (path: string): Promise<number> => {
  try { return Number((await RNFS.stat(path)).size) || 0; } catch { return 0; }
};
const writeCheckpoint = async (path: string, value: HlsCheckpoint) => {
  await RNFS.writeFile(`${path}.tmp`, JSON.stringify(value), 'utf8');
  await RNFS.moveFile(`${path}.tmp`, path);
};

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

const resolveUrl = (targetUrl: string, baseUrl: string): string => {
  try {
    return new URL(targetUrl, baseUrl).toString();
  } catch {
    const base = baseUrl.substring(0, baseUrl.lastIndexOf('/') + 1);
    if (targetUrl.startsWith('http')) {
      return targetUrl;
    }
    if (targetUrl.startsWith('/')) {
      try {
        const u = new URL(baseUrl);
        return `${u.origin}${targetUrl}`;
      } catch {
        return base + targetUrl;
      }
    }
    return base + targetUrl;
  }
};

const normalizeHeaders = (
  headers?: Record<string, string>,
): Record<string, string> => {
  const result: Record<string, string> = {
    'User-Agent': DEFAULT_USER_AGENT,
    ...(headers || {}),
  };
  return result;
};

const parseM3U8Playlist = async (
  url: string,
  headers: Record<string, string> = {},
  signal?: AbortSignal,
): Promise<M3U8Data> => {
  try {
    console.log('Fetching M3U8 playlist:', url);
    const reqHeaders = normalizeHeaders(headers);
    const response = await axios.get(url, {
      headers: reqHeaders,
      timeout: 15000,
      signal,
    });

    const content =
      typeof response.data === 'string' ? response.data : String(response.data);
    console.log('M3U8 content preview:', content.substring(0, 300));
    const lines = content.split('\n').map((line: string) => line.trim());

    const segments: SegmentInfo[] = [];
    let initSegmentUrl: string | undefined;
    let totalDuration = 0;
    let isLive = !lines.includes('#EXT-X-ENDLIST');
    const mediaSequence = Number(lines.find(line => line.startsWith('#EXT-X-MEDIA-SEQUENCE:'))?.split(':')[1] || 0);
    let segmentIndex = 0;
    let discontinuity = false;

    // Check if this is a master playlist (contains #EXT-X-STREAM-INF)
    const hasMasterPlaylist = lines.some((line: string) =>
      line.includes('#EXT-X-STREAM-INF'),
    );

    if (hasMasterPlaylist) {
      console.log(
        'Detected master playlist, looking for best quality stream...',
      );

      let bestQualityUrl: string | null = null;
      let bestAudioGroup: string | undefined;
      let highestBandwidth = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.includes('#EXT-X-STREAM-INF')) {
          const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);
          const bandwidth = bandwidthMatch
            ? parseInt(bandwidthMatch[1], 10)
            : 0;

          // Find the next non-empty, non-comment line which is the stream playlist URL
          let playlistUrl = '';
          for (let j = i + 1; j < lines.length; j++) {
            const candidate = lines[j];
            if (candidate && !candidate.startsWith('#')) {
              playlistUrl = candidate;
              break;
            }
          }

          if (playlistUrl) {
            const resolvedUrl = resolveUrl(playlistUrl, url);
            if (bandwidth > highestBandwidth || !bestQualityUrl) {
              highestBandwidth = bandwidth;
              bestQualityUrl = resolvedUrl;
              bestAudioGroup = tagAttribute(line, 'AUDIO');
            }
          }
        }
      }

      if (bestQualityUrl) {
        console.log(
          'Found best quality stream:',
          bestQualityUrl,
          'with bandwidth:',
          highestBandwidth,
        );
        const video = await parseM3U8Playlist(bestQualityUrl, headers, signal);
        // Audio in its own playlist is not inside the video segments; without
        // it the saved file is silent. Prefer the default rendition.
        const renditions = bestAudioGroup
          ? lines.filter(
              (candidate: string) =>
                candidate.startsWith('#EXT-X-MEDIA:') &&
                tagAttribute(candidate, 'TYPE') === 'AUDIO' &&
                tagAttribute(candidate, 'GROUP-ID') === bestAudioGroup,
            )
          : [];
        const rendition =
          renditions.find(
            (candidate: string) => tagAttribute(candidate, 'DEFAULT') === 'YES',
          ) ||
          renditions.find(
            (candidate: string) =>
              tagAttribute(candidate, 'AUTOSELECT') === 'YES',
          ) ||
          renditions[0];
        // A rendition without a URI is carried in the video itself; fetching
        // another one would replace it with the wrong language.
        if (rendition && tagAttribute(rendition, 'URI')) {
          const audioUrl = resolveUrl(tagAttribute(rendition, 'URI')!, url);
          console.log('Found separate audio rendition:', audioUrl);
          // Any audio problem falls back to the video alone, as before.
          try {
            const audio = await parseM3U8Playlist(audioUrl, headers, signal);
            if (audio.segments.length > 0) {
              video.audio = audio;
            }
          } catch (error) {
            console.warn('Audio rendition unavailable, video only:', error);
          }
        }
        return video;
      } else {
        throw new Error('No valid stream found in master playlist');
      }
    }

    // Parse regular playlist with segments
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('#EXT-X-ENDLIST')) {
        isLive = false;
      } else if (line === '#EXT-X-DISCONTINUITY') {
        discontinuity = true;
      } else if (line.startsWith('#EXT-X-KEY:')) {
        // Segments are joined as raw bytes, so encrypted or byte range
        // playlists would save a file that cannot be played.
        const method = line.match(/METHOD=([^,\s]+)/)?.[1];
        if (method && method !== 'NONE') {
          throw new Error(`Encrypted HLS (${method}) cannot be downloaded`);
        }
      } else if (line.startsWith('#EXT-X-BYTERANGE')) {
        throw new Error('HLS byte range playlists cannot be downloaded');
      } else if (line.includes('#EXT-X-MAP:')) {
        const uriMatch = line.match(/URI=["']?([^"']+)["']?/);
        if (uriMatch && uriMatch[1]) {
          initSegmentUrl = resolveUrl(uriMatch[1], url);
        }
      } else if (line.includes('#EXTINF:')) {
        const durationMatch = line.match(/#EXTINF:([\d.]+)/);
        const duration = durationMatch ? parseFloat(durationMatch[1]) : 0;

        // Scan subsequent lines for the segment URL
        let segmentUrl = '';
        for (let j = i + 1; j < lines.length; j++) {
          const candidate = lines[j];
          if (candidate && !candidate.startsWith('#')) {
            segmentUrl = candidate;
            break;
          }
        }

        if (segmentUrl) {
          const resolvedSegmentUrl = resolveUrl(segmentUrl, url);
          segments.push({
            duration,
            url: resolvedSegmentUrl,
            index: segmentIndex++,
            discontinuity,
            initSegmentUrl,
          });
          totalDuration += duration;
          discontinuity = false;
        }
      }
    }

    console.log(
      `Parsed ${segments.length} segments, total duration: ${totalDuration}s, hasInit: ${Boolean(initSegmentUrl)}`,
    );

    return {
      segments,
      initSegmentUrl,
      totalDuration,
      isLive,
      mediaSequence,
    };
  } catch (error) {
    console.error('Error parsing M3U8:', error);
    throw error;
  }
};

const downloadSegment = async (
  downloadId: string,
  segmentUrl: string,
  outputPath: string,
  headers: Record<string, string> = {},
): Promise<void> => {
  assertRunning(downloadId);

  const reqHeaders = normalizeHeaders(headers);
  if (canFetchNatively) {
    const {statusCode} = await nativeFetcher!.fetchToFile!(
      downloadId,
      segmentUrl,
      outputPath,
      reqHeaders,
    );
    if (statusCode < 200 || statusCode >= 300) {
      throw new SegmentHttpError(statusCode);
    }
    return;
  }

  const download = RNFS.downloadFile({
    fromUrl: segmentUrl,
    toFile: outputPath,
    headers: reqHeaders,
    background: false,
    discretionary: false,
    cacheable: false,
    progressDivider: 0,
    connectionTimeout: 30000,
    readTimeout: 30000,
  });

  const ids = fallbackJobs.get(downloadId) || new Set<number>();
  fallbackJobs.set(downloadId, ids);
  ids.add(download.jobId);
  let result;
  try { result = await download.promise; } finally { ids.delete(download.jobId); }
  if (result.statusCode < 200 || result.statusCode >= 400) {
    if (await RNFS.exists(outputPath)) {
      await RNFS.unlink(outputPath).catch(() => undefined);
    }
    throw new SegmentHttpError(result.statusCode);
  }
};

type DownloadTrack = {
  name: string;
  data: M3U8Data;
  paths: string[];
  initPaths: Map<string, string>;
};

// Feed the downloaded segments to the HLS demuxer, preserving their durations,
// initialization changes and timestamp discontinuities. Raw concatenation loses
// this information and does not create an MP4 duration or seek index.
const writeLocalPlaylist = async (track: DownloadTrack, tempDir: string) => {
  const lines = [
    '#EXTM3U',
    '#EXT-X-VERSION:7',
    '#EXT-X-PLAYLIST-TYPE:VOD',
    `#EXT-X-TARGETDURATION:${Math.ceil(track.data.segments.reduce((max, segment) => Math.max(max, segment.duration), 0))}`,
    '#EXT-X-MEDIA-SEQUENCE:0',
  ];
  let previousInit: string | undefined;
  for (const segment of track.data.segments) {
    if (segment.discontinuity) lines.push('#EXT-X-DISCONTINUITY');
    if (segment.initSegmentUrl && segment.initSegmentUrl !== previousInit) {
      const initPath = track.initPaths.get(segment.initSegmentUrl)!;
      lines.push(
        `#EXT-X-MAP:URI="${initPath.substring(initPath.lastIndexOf('/') + 1)}"`,
      );
      previousInit = segment.initSegmentUrl;
    }
    lines.push(`#EXTINF:${segment.duration},`);
    const segmentPath = track.paths[segment.index];
    lines.push(segmentPath.substring(segmentPath.lastIndexOf('/') + 1));
  }
  lines.push('#EXT-X-ENDLIST');
  const playlistPath = `${tempDir}/${track.name}.m3u8`;
  await RNFS.writeFile(playlistPath, lines.join('\n') + '\n', 'utf8');
  return playlistPath;
};

export const hlsDownloader2 = async ({
  videoUrl,
  downloadId,
  path,
  title,
  tempDirectory,
  onJobStarted,
  onProgress,
  onCompleted,
  onFinalizing,
  onResumable,
  headers = {},
  connections = 4,
}: {
  videoUrl: string;
  downloadId: string;
  path: string;
  title: string;
  tempDirectory?: string;
  onJobStarted?: (jobId: string) => void;
  onProgress?: (completedSegments: number, totalSegments: number) => void;
  onCompleted?: (outputPath: string) => void | Promise<void>;
  onFinalizing?: () => void;
  onResumable?: (resumable: boolean) => void;
  headers?: any;
  /** Segments downloaded at the same time. */
  connections?: number;
}) => {
  if (activeDownloads.has(downloadId)) throw new Error('HLS download is already active');
  cancelledDownloads.delete(downloadId);
  pausedDownloads.delete(downloadId);
  let stopped!: () => void;
  completion.set(downloadId, new Promise<void>(resolve => { stopped = resolve; }));
  activeDownloads.add(downloadId);

  const tempDir = tempDirectory || `${RNFS.CachesDirectoryPath}/hls_segments`;

  try {
    onJobStarted?.(downloadId);
    assertRunning(downloadId);
    // Ensure temp directory exists
    if (!(await RNFS.exists(tempDir))) {
      await RNFS.mkdir(tempDir);
    }

    // Parse the M3U8 playlist
    console.log('Parsing M3U8 playlist...');
    const controller = new AbortController();
    playlistRequests.set(downloadId, controller);
    const m3u8Data = await parseM3U8Playlist(videoUrl, headers, controller.signal);
    playlistRequests.delete(downloadId);
    assertRunning(downloadId);

    if (m3u8Data.segments.length === 0) {
      throw new Error('No segments found in playlist');
    }

    console.log(
      `Found ${m3u8Data.segments.length} segments, total duration: ${m3u8Data.totalDuration}s`,
    );

    if (!canFinalizeHls) {
      throw new Error('HLS MP4 finalization is unavailable; update the app');
    }
    const audioData = m3u8Data.audio;
    const resumable = !m3u8Data.isLive && !audioData?.isLive;
    if (!resumable) liveDownloads.add(downloadId);
    onResumable?.(resumable);

    // Download each track separately, retaining initialization changes for
    // the local HLS playlists used by the finalizer.
    const tracks: DownloadTrack[] = [
      {name: 'video', data: m3u8Data, paths: [], initPaths: new Map()},
    ];
    if (audioData) {
      tracks.push({
        name: 'audio',
        data: audioData,
        paths: [],
        initPaths: new Map(),
      });
    }
    const jobs: {url: string; path: string}[] = [];
    for (const track of tracks) {
      for (const segment of track.data.segments) {
        if (
          segment.initSegmentUrl &&
          !track.initPaths.has(segment.initSegmentUrl)
        ) {
          const initPath = `${tempDir}/${track.name}_init_${track.initPaths.size}.mp4`;
          track.initPaths.set(segment.initSegmentUrl, initPath);
          jobs.push({url: segment.initSegmentUrl, path: initPath});
        }
        const segmentPath = `${tempDir}/${track.name}_${segment.index}.ts`;
        track.paths.push(segmentPath);
        jobs.push({url: segment.url, path: segmentPath});
      }
    }

    const checkpointPath = `${tempDir}/resume.json`;
    // Keep full URLs, sequence numbers and track structure. Changed signed URLs
    // conservatively restart rather than mix segments from different encodes.
    const identity = JSON.stringify({url: videoUrl, video: m3u8Data, audio: audioData});
    let checkpoint: HlsCheckpoint = {version: 1, identity};
    let saved: HlsCheckpoint | undefined;
    try { saved = JSON.parse(await RNFS.readFile(checkpointPath, 'utf8')); } catch { /* Start without unverified progress. */ }
    if (saved?.version === 1 && saved.identity === identity && !m3u8Data.isLive && !audioData?.isLive) {
      checkpoint = saved;
    } else {
      // Never reuse old files under a new playlist identity if cleanup fails.
      if (await RNFS.exists(tempDir)) await RNFS.unlink(tempDir);
      await RNFS.mkdir(tempDir);
    }
    await writeCheckpoint(checkpointPath, checkpoint);
    assertRunning(downloadId);
    const muxedPath = `${tempDir}/finalized.mp4`;
    const finalized = Boolean(checkpoint.finalizedSize && await fileSize(muxedPath) === checkpoint.finalizedSize);
    let completedJobs = 0;
    const existing = new Map<string, number>();
    try {
      for (const entry of await RNFS.readDir(tempDir)) if (entry.isFile()) existing.set(entry.path, Number(entry.size));
    } catch { /* Missing/cleared cache is safely downloaded again. */ }
    const pendingJobs: typeof jobs = [];
    for (const job of jobs) {
      if (finalized || (existing.get(job.path) || 0) > 0) completedJobs++;
      else pendingJobs.push(job);
    }
    onProgress?.(completedJobs, jobs.length);

    // A pool of workers takes segments in order. Each 429 or 503 removes a
    // worker, so a server that limits connections gets fewer of them.
    let downloadedSegments = completedJobs;
    let nextJob = 0;
    let workerLimit = Math.max(1, Math.min(connections, pendingJobs.length));
    let failed = false;
    let firstError: unknown;

    const downloadWithRetry = async (url: string, segmentPath: string) => {
      for (let attempt = 1; ; attempt++) {
        try {
          assertRunning(downloadId);
          if (failed) throw firstError;
          const partial = `${segmentPath}.part`;
          await downloadSegment(downloadId, url, partial, headers);
          assertRunning(downloadId);
          if (await fileSize(partial) <= 0) throw new Error('Downloaded HLS segment is empty');
          // A final segment name is the durable completion marker. Interrupted
          // .part files are never reused, including after a process restart.
          await RNFS.moveFile(partial, segmentPath);
          return;
        } catch (error) {
          assertRunning(downloadId);
          if (failed) throw firstError || error;
          const status = error instanceof SegmentHttpError ? error.status : 0;
          const rateLimited = status === 429 || status === 503;
          const permanent =
            status >= 400 && status < 500 && status !== 408 && !rateLimited;
          if (permanent || attempt >= MAX_SEGMENT_ATTEMPTS) {
            throw error;
          }
          if (rateLimited && workerLimit > 1) {
            workerLimit--;
          }
          await retrySleep(downloadId,
            Math.min(
              SEGMENT_RETRY_BASE_MS * 2 ** (attempt - 1),
              MAX_SEGMENT_RETRY_MS,
            ),
          );
        }
      }
    };

    const runWorker = async (workerIndex: number) => {
      while (workerIndex < workerLimit && !failed) {
        assertRunning(downloadId);
        const job = pendingJobs[nextJob++];
        if (!job) {
          return;
        }
        try {
          await downloadWithRetry(job.url, job.path);
        } catch (error) {
          if (!failed) firstError = error;
          failed = true;
          stopTransfers(downloadId);
          console.error(`Failed to download segment ${job.path}:`, error);
          throw error;
        }
        downloadedSegments++;
        onProgress?.(downloadedSegments, jobs.length);
      }
    };

    // Do not clean up or allow a restart while another worker still writes.
    const results = await Promise.allSettled(
      Array.from({length: workerLimit}, (_, index) => runWorker(index)),
    );
    assertRunning(downloadId);
    const failure = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
    if (failure) throw firstError || failure.reason;

    if (cancelledDownloads.has(downloadId)) {
      throw new Error('Download cancelled by user');
    }

    assertRunning(downloadId);
    finalizingDownloads.add(downloadId);
    onFinalizing?.();
    console.log('Finalizing HLS as MP4...');
    const videoPlaylist = await writeLocalPlaylist(tracks[0], tempDir);
    const audioPlaylist = tracks[1]
      ? await writeLocalPlaylist(tracks[1], tempDir)
      : null;
    const finalize = async (audio: string | null) => {
      const result = await nativeFetcher!.finalizeHls!(
        videoPlaylist,
        audio,
        muxedPath,
      );
      if (!Number.isFinite(result.duration) || result.duration <= 0) {
        throw new Error('Finalized HLS file has no valid duration');
      }
    };
    if (!finalized) try {
      await finalize(audioPlaylist);
    } catch (error) {
      if (!audioPlaylist || cancelledDownloads.has(downloadId)) {
        throw error;
      }
      // Keep the video rather than failing the whole download.
      console.warn('Muxing separate audio failed, keeping video only:', error);
      await finalize(null);
    }
    if (cancelledDownloads.has(downloadId)) {
      throw new Error('Download cancelled by user');
    }

    checkpoint.finalizedSize = await fileSize(muxedPath);
    await writeCheckpoint(checkpointPath, checkpoint);

    // Only the finalized MP4 is needed now. Delete the segments before moving
    // it so the cache never holds the segments and two copies of the movie.
    const intermediateFiles = [
      ...tracks.flatMap(track => [
        ...track.paths,
        ...Array.from(track.initPaths.values()),
      ]),
      videoPlaylist,
      ...(audioPlaylist ? [audioPlaylist] : []),
    ];
    for (const file of intermediateFiles) {
      await RNFS.unlink(file).catch(() => undefined);
    }

    if (await RNFS.exists(path)) {
      await RNFS.unlink(path).catch(() => undefined);
    }
    // moveFile renames within a filesystem and copies across filesystems. If
    // it fails, copy instead so the result is never worse than before.
    try {
      await RNFS.moveFile(muxedPath, path);
    } catch (error) {
      console.warn('Moving the finalized MP4 failed, copying it:', error);
      await RNFS.unlink(path).catch(() => undefined);
      await RNFS.copyFile(muxedPath, path);
    }

    // Clean up temp directory
    if (await RNFS.exists(tempDir)) {
      await RNFS.unlink(tempDir).catch(() => undefined);
    }

    if (cancelledDownloads.has(downloadId)) {
      if (await RNFS.exists(path)) {
        await RNFS.unlink(path).catch(() => undefined);
      }
      throw new Error('Download cancelled by user');
    }

    // Success
    console.log('Download completed successfully');
    await onCompleted?.(path);
  } catch (error) {
    console.error('HLS download failed:', error);

    const cancelled = cancelledDownloads.has(downloadId);

    // Preserve complete segments and the journal on pause/network/remux errors.
    // Explicit cancellation is the only failure path that discards progress.
    if (cancelled) {
      await RNFS.unlink(tempDir).catch(() => undefined);
      await RNFS.unlink(path).catch(() => undefined);
    }

    const errorMessage = cancelled
      ? 'Download cancelled'
      : `Failed to download ${title}`;
    console.error(errorMessage);

    assertRunning(downloadId);
    throw error;
  } finally {
    if (canFetchNatively) {
      nativeFetcher!.cancelFetches!(downloadId);
    }
    activeDownloads.delete(downloadId);
    cancelledDownloads.delete(downloadId);
    pausedDownloads.delete(downloadId);
    finalizingDownloads.delete(downloadId);
    liveDownloads.delete(downloadId);
    fallbackJobs.delete(downloadId);
    playlistRequests.delete(downloadId);
    retryWaits.delete(downloadId);
    completion.delete(downloadId);
    stopped();
  }
};

// Pause ends the current job, freeing its queue slot. Resume re-enters start
// and validates the journal before reusing only committed segment files.
export const pauseHlsDownload = async (downloadId: string): Promise<void> => {
  if (!activeDownloads.has(downloadId) || finalizingDownloads.has(downloadId) || liveDownloads.has(downloadId)) {
    throw new Error('HLS download cannot be paused at this stage');
  }
  pausedDownloads.add(downloadId);
  stopTransfers(downloadId);
  await completion.get(downloadId);
};

export const cancelHlsDownload = async (downloadId: string): Promise<void> => {
  if (activeDownloads.has(downloadId)) {
    cancelledDownloads.add(downloadId);
    stopTransfers(downloadId);
    await completion.get(downloadId);
  }
};

export const isHlsDownloadInProgress = (downloadId: string): boolean =>
  activeDownloads.has(downloadId) && !cancelledDownloads.has(downloadId) && !pausedDownloads.has(downloadId);

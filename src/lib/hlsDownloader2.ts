import * as RNFS from '@dr.pogodin/react-native-fs';
import axios from 'axios';
import {notificationService} from './services/Notification';

interface SegmentInfo {
  duration: number;
  url: string;
  index: number;
}

interface M3U8Data {
  segments: SegmentInfo[];
  totalDuration: number;
  isLive: boolean;
}

let downloadCancelled = false;
let currentDownloadId: string | null = null;

// Map to store the relationship between numeric IDs and fileName for HLS downloads
const hlsDownloadMap = new Map<number, string>();
let nextHlsId = 1000; // Start HLS IDs from 1000 to distinguish from RNFS job IDs

const parseM3U8Playlist = async (
  url: string,
  headers: any = {},
): Promise<M3U8Data> => {
  try {
    console.log('Fetching M3U8 playlist:', url);
    const response = await axios.get(url, {
      headers,
      timeout: 10000,
    });

    const content = response.data;
    console.log('M3U8 content preview:', content.substring(0, 500));
    const lines = content.split('\n').map((line: string) => line.trim());

    const segments: SegmentInfo[] = [];
    let totalDuration = 0;
    let isLive = false;
    let segmentIndex = 0;

    const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

    // Check if this is a master playlist (contains #EXT-X-STREAM-INF)
    const hasMasterPlaylist = lines.some((line: string) =>
      line.includes('#EXT-X-STREAM-INF'),
    );

    if (hasMasterPlaylist) {
      console.log(
        'Detected master playlist, looking for best quality stream...',
      );

      // Find the best quality stream URL
      let bestQualityUrl = null;
      let highestBandwidth = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.includes('#EXT-X-STREAM-INF')) {
          // Extract bandwidth
          const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);
          const bandwidth = bandwidthMatch
            ? parseInt(bandwidthMatch[1], 10)
            : 0;

          // Get the next line which should be the playlist URL
          if (i + 1 < lines.length) {
            let playlistUrl = lines[i + 1];
            if (
              !playlistUrl.startsWith('http') &&
              !playlistUrl.startsWith('#')
            ) {
              playlistUrl = baseUrl + playlistUrl;
            }

            // Choose the highest bandwidth stream
            if (bandwidth > highestBandwidth) {
              highestBandwidth = bandwidth;
              bestQualityUrl = playlistUrl;
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
        // Recursively parse the actual playlist
        return await parseM3U8Playlist(bestQualityUrl, headers);
      } else {
        throw new Error('No valid stream found in master playlist');
      }
    }

    // Parse regular playlist with segments
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('#EXT-X-ENDLIST')) {
        isLive = false;
      } else if (line.includes('#EXTINF:')) {
        const durationMatch = line.match(/#EXTINF:([\d.]+)/);
        const duration = durationMatch ? parseFloat(durationMatch[1]) : 0;

        // Next line should be the segment URL
        if (i + 1 < lines.length) {
          let segmentUrl = lines[i + 1];

          // Skip lines that start with # (comments/metadata)
          if (segmentUrl.startsWith('#')) {
            continue;
          }

          if (!segmentUrl.startsWith('http')) {
            segmentUrl = baseUrl + segmentUrl;
          }

          segments.push({
            duration,
            url: segmentUrl,
            index: segmentIndex++,
          });

          totalDuration += duration;
        }
      }
    }

    console.log(
      `Parsed ${segments.length} segments, total duration: ${totalDuration}s`,
    );

    return {
      segments,
      totalDuration,
      isLive,
    };
  } catch (error) {
    console.error('Error parsing M3U8:', error);
    throw error;
  }
};

const downloadSegment = async (
  segmentUrl: string,
  outputPath: string,
  headers: any = {},
): Promise<void> => {
  if (downloadCancelled) {
    throw new Error('Download cancelled');
  }

  const response = await axios({
    method: 'GET',
    url: segmentUrl,
    headers,
    responseType: 'arraybuffer',
    timeout: 30000,
  });

  // Convert ArrayBuffer to base64 string directly
  const arrayBuffer = response.data as ArrayBuffer;
  const uint8Array = new Uint8Array(arrayBuffer);
  const binary = Array.from(uint8Array, byte => String.fromCharCode(byte)).join(
    '',
  );
  const base64 = btoa(binary);

  await RNFS.appendFile(outputPath, base64, 'base64');
};

const mergeSegments = async (
  segmentPaths: string[],
  outputPath: string,
): Promise<void> => {
  // For TS segments, we can simply concatenate them by appending files
  let isFirstFile = true;

  for (const segmentPath of segmentPaths) {
    if (await RNFS.exists(segmentPath)) {
      const content = await RNFS.readFile(segmentPath, 'base64');

      if (isFirstFile) {
        await RNFS.writeFile(outputPath, content, 'base64');
        isFirstFile = false;
      } else {
        await RNFS.appendFile(outputPath, content, 'base64');
      }

      // Clean up segment file
      await RNFS.unlink(segmentPath);
    }
  }
};

export const hlsDownloader2 = async ({
  videoUrl,
  path,
  fileName,
  title,
  setDownloadActive,
  setAlreadyDownloaded,
  setDownloadId,
  headers = {},
}: {
  videoUrl: string;
  path: string;
  fileName: string;
  title: string;
  setDownloadActive: (value: boolean) => void;
  setAlreadyDownloaded: (value: boolean) => void;
  setDownloadId: (value: number) => void;
  headers?: any;
}) => {
  downloadCancelled = false;
  currentDownloadId = fileName;

  // Generate a unique numeric ID for this HLS download
  const hlsJobId = nextHlsId++;
  hlsDownloadMap.set(hlsJobId, fileName);
  setDownloadId(hlsJobId);

  const tempDir = RNFS.CachesDirectoryPath + '/hls_segments/';

  try {
    // Ensure temp directory exists
    if (!(await RNFS.exists(tempDir))) {
      await RNFS.mkdir(tempDir);
    }

    // Parse the M3U8 playlist
    console.log('Parsing M3U8 playlist...');
    const m3u8Data = await parseM3U8Playlist(videoUrl, headers);

    if (m3u8Data.segments.length === 0) {
      throw new Error('No segments found in playlist');
    }

    console.log(
      `Found ${m3u8Data.segments.length} segments, total duration: ${m3u8Data.totalDuration}s`,
    );

    let downloadedSegments = 0;
    const segmentPaths: string[] = [];
    const maxConcurrentDownloads = 10; // Limit concurrent downloads

    // Download segments in batches
    for (let i = 0; i < m3u8Data.segments.length; i += maxConcurrentDownloads) {
      if (downloadCancelled) {
        throw new Error('Download cancelled by user');
      }

      const batch = m3u8Data.segments.slice(i, i + maxConcurrentDownloads);
      const batchPromises = batch.map(async segment => {
        const segmentPath = tempDir + `segment_${segment.index}.ts`;
        segmentPaths[segment.index] = segmentPath;

        try {
          await downloadSegment(segment.url, segmentPath, headers);
          downloadedSegments++;

          const progress =
            (downloadedSegments / m3u8Data.segments.length) * 100;

          console.log(
            `Downloaded segment ${segment.index + 1}/${
              m3u8Data.segments.length
            } (${progress.toFixed(1)}%)`,
          );
          await notificationService.showDownloadProgress(
            title,
            fileName,
            progress / 100,
            `Downloaded ${progress.toFixed(1)}%`,
            hlsJobId,
          );
        } catch (error) {
          console.error(`Failed to download segment ${segment.index}:`, error);
          throw error;
        }
      });

      await Promise.all(batchPromises);

      // Small delay between batches to avoid overwhelming the server
      if (i + maxConcurrentDownloads < m3u8Data.segments.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    if (downloadCancelled) {
      throw new Error('Download cancelled by user');
    }

    // Merge all segments into final file
    console.log('Merging segments...');
    await notificationService.showDownloadProgress(
      title,
      fileName,
      1,
      'Merging video segments...',
      hlsJobId,
    );

    await mergeSegments(segmentPaths, path);

    // Clean up temp directory
    if (await RNFS.exists(tempDir)) {
      await RNFS.unlink(tempDir);
    }

    if (downloadCancelled) {
      // Clean up the output file if cancelled during merge
      if (await RNFS.exists(path)) {
        await RNFS.unlink(path);
      }
      throw new Error('Download cancelled by user');
    }

    // Success
    console.log('Download completed successfully');
    setAlreadyDownloaded(true);
    setDownloadActive(false);

    await notificationService.showDownloadComplete(title, fileName);
  } catch (error) {
    console.error('HLS download failed:', error);

    // Clean up on error
    setAlreadyDownloaded(false);
    setDownloadActive(false);

    if (await RNFS.exists(tempDir)) {
      await RNFS.unlink(tempDir);
    }

    if (await RNFS.exists(path)) {
      await RNFS.unlink(path);
    }

    const errorMessage = downloadCancelled
      ? 'Download cancelled'
      : `Failed to download ${title}`;
    console.error(errorMessage);

    if (downloadCancelled) {
      await notificationService.cancelNotification(fileName);
    } else {
      await notificationService.showDownloadFailed(title, fileName);
    }
  } finally {
    currentDownloadId = null;
    // Clean up the mapping
    hlsDownloadMap.delete(hlsJobId);
  }
};

// Function to cancel ongoing download
export const cancelHlsDownload = (downloadId: number | string) => {
  // Handle both numeric HLS job IDs and string fileName
  let targetFileName: string | null = null;

  if (typeof downloadId === 'number') {
    // It's an HLS job ID, get the fileName from mapping
    targetFileName = hlsDownloadMap.get(downloadId) || null;
  } else {
    // It's a fileName directly
    targetFileName = downloadId;
  }

  if (currentDownloadId === targetFileName) {
    downloadCancelled = true;
    console.log(`Cancelling HLS download: ${targetFileName}`);
  }
};

// Check if a download is in progress
export const isHlsDownloadInProgress = (
  downloadId: number | string,
): boolean => {
  let targetFileName: string | null = null;

  if (typeof downloadId === 'number') {
    targetFileName = hlsDownloadMap.get(downloadId) || null;
  } else {
    targetFileName = downloadId;
  }

  return currentDownloadId === targetFileName && !downloadCancelled;
};

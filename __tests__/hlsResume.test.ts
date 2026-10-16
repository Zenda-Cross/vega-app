const mockFiles = new Map<string, string>();
let mockPlaylist: string;
const mockPlaylists = new Map<string, string>();
let mockPublishFails = false;
const mockFetch = jest.fn(async (_id: string, url: string, path: string) => {
  mockFiles.set(path, `complete:${url}`);
  return {statusCode: 200};
});
const mockCancel = jest.fn();
const mockFinalize = jest.fn(async (_video: string, _audio: string | null, output: string) => {
  mockFiles.set(output, 'finalized-mp4');
  return {duration: 3};
});
jest.mock('react-native', () => ({NativeModules: {HttpDownloadModule: {
  fetchToFile: (...args: Parameters<typeof mockFetch>) => mockFetch(...args),
  cancelFetches: (id: string) => mockCancel(id),
  finalizeHls: (...args: Parameters<typeof mockFinalize>) => mockFinalize(...args),
}}}));
jest.mock('axios', () => ({__esModule: true, default: {get: async (url: string) => ({data: mockPlaylists.get(url) || mockPlaylist})}}));
jest.mock('@dr.pogodin/react-native-fs', () => ({
  CachesDirectoryPath: '/cache',
  exists: async (path: string) => mockFiles.has(path) || [...mockFiles.keys()].some(key => key.startsWith(`${path}/`)),
  mkdir: async () => undefined,
  readFile: async (path: string) => {
    if (!mockFiles.has(path)) throw new Error('ENOENT');
    return mockFiles.get(path);
  },
  writeFile: async (path: string, data: string) => {mockFiles.set(path, data);},
  stat: async (path: string) => {
    if (!mockFiles.has(path)) throw new Error('ENOENT');
    return {size: mockFiles.get(path)!.length};
  },
  readDir: async (directory: string) => [...mockFiles.entries()]
    .filter(([path]) => path.startsWith(`${directory}/`))
    .map(([path, data]) => ({path, size: data.length, isFile: () => true})),
  unlink: async (path: string) => {
    for (const key of [...mockFiles.keys()]) if (key === path || key.startsWith(`${path}/`)) mockFiles.delete(key);
  },
  moveFile: async (source: string, target: string) => {
    if (mockPublishFails && source.endsWith('/finalized.mp4')) throw new Error('EXDEV');
    if (!mockFiles.has(source)) throw new Error('ENOENT');
    mockFiles.set(target, mockFiles.get(source)!);
    mockFiles.delete(source);
  },
  copyFile: async (source: string, target: string) => {
    if (mockPublishFails) throw new Error('ENOSPC');
    mockFiles.set(target, mockFiles.get(source)!);
  },
}));

import {hlsDownloader2, pauseHlsDownload, cancelHlsDownload} from '../src/lib/hlsDownloader2';

const playlist = (sequence = 0) => ['#EXTM3U', `#EXT-X-MEDIA-SEQUENCE:${sequence}`,
  '#EXTINF:1,', 'a.ts', '#EXTINF:1,', 'b.ts', '#EXTINF:1,', 'c.ts', '#EXT-X-ENDLIST'].join('\n');
const options = {downloadId: 'resume', videoUrl: 'https://example.com/movie.m3u8',
  path: '/saved/movie.mp4', tempDirectory: '/cache/resume', title: 'Movie', connections: 1};
const fetched = (name: string) => mockFetch.mock.calls.filter(call => call[1].endsWith(`/${name}.ts`)).length;
const nativeFetch = async (_id: string, url: string, path: string) => {
  mockFiles.set(path, `complete:${url}`);
  return {statusCode: 200};
};
beforeEach(() => {
  mockFiles.clear();
  mockPlaylist = playlist();
  mockPlaylists.clear();
  mockPublishFails = false;
  mockFetch.mockReset().mockImplementation(nativeFetch);
  mockCancel.mockReset();
  mockFinalize.mockClear();
});

const failSecondSegment = () => mockFetch.mockImplementation(async (id, url, path) => {
  if (url.endsWith('/b.ts')) {
    mockFiles.set(path, 'incomplete');
    return {statusCode: 404};
  }
  return nativeFetch(id, url, path);
});

it('resumes from disk after failure, reusing complete segments and replacing partial ones', async () => {
  failSecondSegment();
  await expect(hlsDownloader2(options)).rejects.toThrow('HTTP status 404');
  expect(mockFiles.has('/cache/resume/video_0.ts')).toBe(true);
  expect(mockFiles.has('/cache/resume/video_1.ts.part')).toBe(true);
  mockFetch.mockImplementation(nativeFetch);
  const progress = jest.fn();
  await hlsDownloader2({...options, onProgress: progress});
  expect(progress).toHaveBeenCalledWith(1, 3);
  expect(fetched('a')).toBe(1);
  expect(fetched('b')).toBe(2);
  expect(fetched('c')).toBe(1);
  expect(mockFiles.get('/saved/movie.mp4')).toBe('finalized-mp4');
});

it('stops in-flight transfers on pause and resumes with a new queued job', async () => {
  let secondStarted!: () => void;
  const started = new Promise<void>(resolve => {secondStarted = resolve;});
  mockFetch.mockImplementation(async (id, url, path) => {
    if (!url.endsWith('/b.ts')) return nativeFetch(id, url, path);
    return new Promise((_resolve, reject) => {
      mockCancel.mockImplementation(() => reject(new Error('Canceled')));
      secondStarted();
    });
  });
  const running = hlsDownloader2(options);
  const stopped = running.catch(error => {expect(error.message).toBe('Download paused');});
  await started;
  await pauseHlsDownload(options.downloadId);
  await stopped;
  expect(mockFinalize).not.toHaveBeenCalled();
  mockCancel.mockReset();
  mockFetch.mockImplementation(nativeFetch);
  await hlsDownloader2(options);
  expect(fetched('a')).toBe(1);
  expect(mockFiles.get('/saved/movie.mp4')).toBe('finalized-mp4');
});

it.each(['playlist', 'sequence', 'token', 'journal'])('discards unsafe saved segments after a changed %s', async change => {
  failSecondSegment();
  await expect(hlsDownloader2(options)).rejects.toThrow();
  if (change === 'playlist') mockPlaylist = mockPlaylist.replace('#EXTINF:1,', '#EXTINF:2,');
  if (change === 'sequence') mockPlaylist = playlist(7);
  if (change === 'journal') mockFiles.set('/cache/resume/resume.json', '{broken');
  mockFetch.mockImplementation(nativeFetch);
  await hlsDownloader2({...options, videoUrl: change === 'token' ? `${options.videoUrl}?new-token` : options.videoUrl});
  expect(fetched('a')).toBe(2);
});

it('redownloads empty completed files instead of trusting their names', async () => {
  failSecondSegment();
  await expect(hlsDownloader2(options)).rejects.toThrow();
  mockFiles.set('/cache/resume/video_0.ts', '');
  mockFetch.mockImplementation(nativeFetch);
  await hlsDownloader2(options);
  expect(fetched('a')).toBe(2);
});

it('retains a finalized MP4 after publication fails and retries without fetching or remuxing', async () => {
  mockPublishFails = true;
  await expect(hlsDownloader2(options)).rejects.toThrow('ENOSPC');
  expect(mockFiles.get('/cache/resume/finalized.mp4')).toBe('finalized-mp4');
  mockPublishFails = false;
  await hlsDownloader2(options);
  expect(mockFetch).toHaveBeenCalledTimes(3);
  expect(mockFinalize).toHaveBeenCalledTimes(1);
});

it('explicit cancellation removes the checkpoint and completed segments', async () => {
  let secondStarted!: () => void;
  const started = new Promise<void>(resolve => {secondStarted = resolve;});
  mockFetch.mockImplementation(async (id, url, path) => {
    if (!url.endsWith('/b.ts')) return nativeFetch(id, url, path);
    return new Promise((_resolve, reject) => {
      mockCancel.mockImplementation(() => reject(new Error('Canceled')));
      secondStarted();
    });
  });
  const running = hlsDownloader2(options);
  const stopped = running.catch(error => {expect(error.message).toBe('Download cancelled');});
  await started;
  await cancelHlsDownload(options.downloadId);
  await stopped;
  expect(mockFiles.size).toBe(0);
});

it('drains concurrent workers without retrying aborted peers after a permanent failure', async () => {
  let secondStarted!: () => void;
  const started = new Promise<void>(resolve => {secondStarted = resolve;});
  mockFetch.mockImplementation(async (_id, url) => {
    if (url.endsWith('/a.ts')) {
      await started;
      return {statusCode: 404};
    }
    return new Promise((_resolve, reject) => {
      mockCancel.mockImplementation(() => reject(new Error('Canceled')));
      secondStarted();
    });
  });
  await expect(hlsDownloader2({...options, connections: 2})).rejects.toThrow('HTTP status 404');
  expect(mockFetch).toHaveBeenCalledTimes(2);
  expect(mockFinalize).not.toHaveBeenCalled();
});

it('does not advertise pause/resume for a sliding live playlist', async () => {
  mockPlaylist = playlist().replace('#EXT-X-ENDLIST', '');
  const resumable = jest.fn();
  await hlsDownloader2({...options, onResumable: resumable});
  expect(resumable).toHaveBeenCalledWith(false);
});

it('reuses committed fMP4 initialization data as well as video segments', async () => {
  mockPlaylist = playlist().replace('#EXTM3U', '#EXTM3U\n#EXT-X-MAP:URI="init.mp4"');
  failSecondSegment();
  await expect(hlsDownloader2(options)).rejects.toThrow();
  expect(mockFiles.has('/cache/resume/video_init_0.mp4')).toBe(true);
  mockFetch.mockImplementation(nativeFetch);
  await hlsDownloader2(options);
  expect(mockFetch.mock.calls.filter(call => call[1].endsWith('/init.mp4'))).toHaveLength(1);
  expect(fetched('a')).toBe(1);
});

it('resumes separate audio without downloading the completed video track again', async () => {
  mockPlaylists.set(options.videoUrl, ['#EXTM3U',
    '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",DEFAULT=YES,URI="audio/index.m3u8"',
    '#EXT-X-STREAM-INF:BANDWIDTH=10,AUDIO="aud"', 'video/index.m3u8'].join('\n'));
  mockFetch.mockImplementation(async (id, url, path) => url.endsWith('/audio/b.ts')
    ? {statusCode: 404} : nativeFetch(id, url, path));
  await expect(hlsDownloader2(options)).rejects.toThrow();
  mockFetch.mockImplementation(nativeFetch);
  const progress = jest.fn();
  await hlsDownloader2({...options, onProgress: progress});
  expect(progress).toHaveBeenCalledWith(4, 6);
  expect(mockFetch.mock.calls.filter(call => call[1].includes('/video/'))).toHaveLength(3);
  expect(mockFetch.mock.calls.filter(call => call[1].endsWith('/audio/a.ts'))).toHaveLength(1);
  expect(mockFinalize).toHaveBeenCalledWith('/cache/resume/video.m3u8', '/cache/resume/audio.m3u8', '/cache/resume/finalized.mp4');
});

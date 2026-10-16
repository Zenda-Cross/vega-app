import {beforeEach, describe, expect, it, jest} from '@jest/globals';

const mockFinalizeHls =
  jest.fn<(...args: unknown[]) => Promise<{duration: number}>>();
const mockWriteFile = jest.fn<(...args: unknown[]) => Promise<void>>();
const mockCopyFile = jest.fn<(...args: unknown[]) => Promise<void>>();
const mockMoveFile = jest.fn<(...args: unknown[]) => Promise<void>>();
const mockUnlink = jest.fn<(...args: unknown[]) => Promise<void>>(
  async () => undefined,
);
jest.mock('react-native', () => ({
  NativeModules: {
    HttpDownloadModule: {
      finalizeHls: (...args: unknown[]) => mockFinalizeHls(...args),
    },
  },
}));

const mockAxiosGet = jest.fn<(url: string) => Promise<{data: unknown}>>();
// A permanent HTTP error fails at once; network errors would be retried.
const mockDownloadFile = jest.fn((_options: {fromUrl: string}) => ({
  jobId: 1,
  promise: Promise.resolve({statusCode: 404}),
}));

jest.mock('axios', () => ({
  __esModule: true,
  default: {get: (url: string) => mockAxiosGet(url)},
}));
jest.mock('@dr.pogodin/react-native-fs', () => ({
  CachesDirectoryPath: '/cache',
  exists: jest.fn(async () => true),
  stat: jest.fn(async (path: string) => ({size: path.endsWith('.part') || path.endsWith('finalized.mp4') ? 100 : 0})),
  readDir: jest.fn(async () => []),
  readFile: jest.fn(async () => {throw new Error('No checkpoint');}),
  stopDownload: jest.fn(),
  mkdir: jest.fn(async () => undefined),
  unlink: (...args: unknown[]) => mockUnlink(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
  copyFile: (...args: unknown[]) => mockCopyFile(...args),
  moveFile: (...args: unknown[]) => mockMoveFile(...args),
  downloadFile: (options: {fromUrl: string}) => mockDownloadFile(options),
}));

import {cancelHlsDownload, hlsDownloader2} from '../src/lib/hlsDownloader2';

const download = () =>
  hlsDownloader2({
    videoUrl: 'https://example.com/video.m3u8',
    downloadId: 'movie',
    path: '/cache/movie.mp4',
    title: 'Movie',
  });

const playlist = (...tags: string[]) =>
  ['#EXTM3U', ...tags, '#EXTINF:10.0,', 'segment0.ts', '#EXT-X-ENDLIST'].join(
    '\n',
  );

describe('hlsDownloader2 playlist checks', () => {
  beforeEach(() => {
    mockAxiosGet.mockReset();
  });

  it('refuses encrypted playlists', async () => {
    mockAxiosGet.mockResolvedValue({
      data: playlist('#EXT-X-KEY:METHOD=AES-128,URI="key.bin"'),
    });

    await expect(download()).rejects.toThrow('Encrypted HLS (AES-128)');
  });

  it('refuses byte range playlists', async () => {
    mockAxiosGet.mockResolvedValue({
      data: playlist('#EXT-X-BYTERANGE:1000@0'),
    });

    await expect(download()).rejects.toThrow('byte range');
  });

  it('does not refuse a key tag with METHOD=NONE', async () => {
    mockAxiosGet.mockResolvedValue({
      data: playlist('#EXT-X-KEY:METHOD=NONE'),
    });

    await expect(download()).rejects.toThrow('HTTP status 404');
    expect(mockDownloadFile.mock.calls[0][0].fromUrl).toBe(
      'https://example.com/segment0.ts',
    );
  });
});

describe('hlsDownloader2 audio renditions', () => {
  const master = (...media: string[]) =>
    [
      '#EXTM3U',
      ...media,
      '#EXT-X-STREAM-INF:BANDWIDTH=2000000,AUDIO="aud"',
      'video/index.m3u8',
    ].join('\n');

  const fetchedUrls = () => mockAxiosGet.mock.calls.map(call => call[0]);

  beforeEach(() => {
    mockAxiosGet.mockReset();
    mockDownloadFile.mockClear();
  });

  it('keeps the audio inside the video when the default rendition has no URI', async () => {
    mockAxiosGet.mockImplementation(async (url: string) => ({
      data:
        url === 'https://example.com/video.m3u8'
          ? master(
              '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",NAME="English",LANGUAGE="en",DEFAULT=YES,AUTOSELECT=YES',
              '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",NAME="Spanish",LANGUAGE="es",URI="audio/es.m3u8"',
            )
          : playlist(),
    }));

    await expect(download()).rejects.toThrow('HTTP status 404');
    expect(fetchedUrls()).not.toContain('https://example.com/audio/es.m3u8');
  });

  it('downloads the default rendition when it has its own playlist', async () => {
    mockAxiosGet.mockImplementation(async (url: string) => ({
      data:
        url === 'https://example.com/video.m3u8'
          ? master(
              '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",NAME="Spanish",LANGUAGE="es",URI="audio/es.m3u8"',
              '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",NAME="English",LANGUAGE="en",DEFAULT=YES,URI="audio/en.m3u8"',
            )
          : playlist(),
    }));

    await expect(download()).rejects.toThrow('HTTP status 404');
    expect(fetchedUrls()).toContain('https://example.com/audio/en.m3u8');
    expect(fetchedUrls()).not.toContain('https://example.com/audio/es.m3u8');
  });

  it('falls back to the autoselect rendition when none is default', async () => {
    mockAxiosGet.mockImplementation(async (url: string) => ({
      data:
        url === 'https://example.com/video.m3u8'
          ? master(
              '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",NAME="Commentary",LANGUAGE="en",URI="audio/commentary.m3u8"',
              '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",NAME="English",LANGUAGE="en",AUTOSELECT=YES',
            )
          : playlist(),
    }));

    await expect(download()).rejects.toThrow('HTTP status 404');
    expect(fetchedUrls()).not.toContain(
      'https://example.com/audio/commentary.m3u8',
    );
  });
});

describe('hlsDownloader2 MP4 finalization', () => {
  beforeEach(() => {
    mockAxiosGet.mockReset();
    mockDownloadFile.mockReset();
    mockDownloadFile.mockImplementation(() => ({
      jobId: 1,
      promise: Promise.resolve({statusCode: 200}),
    }));
    mockFinalizeHls.mockReset();
    mockFinalizeHls.mockResolvedValue({duration: 10});
    mockWriteFile.mockReset();
    mockWriteFile.mockResolvedValue(undefined);
    mockCopyFile.mockReset();
    mockCopyFile.mockResolvedValue(undefined);
    mockMoveFile.mockReset();
    mockMoveFile.mockResolvedValue(undefined);
    mockUnlink.mockClear();
  });

  it('remuxes muxed TS even without a separate audio track before publishing the MP4', async () => {
    mockAxiosGet.mockResolvedValue({data: playlist()});
    const completed = jest.fn();
    await hlsDownloader2({
      videoUrl: 'https://example.com/video.m3u8',
      downloadId: 'ts',
      path: '/saved/movie.mp4',
      title: 'Movie',
      onCompleted: completed,
    });
    expect(mockWriteFile).toHaveBeenCalledWith(
      '/cache/hls_segments/video.m3u8',
      expect.stringContaining('#EXTINF:10,\nvideo_0.ts\n#EXT-X-ENDLIST'),
      'utf8',
    );
    expect(mockFinalizeHls).toHaveBeenCalledWith(
      '/cache/hls_segments/video.m3u8',
      null,
      '/cache/hls_segments/finalized.mp4',
    );
    expect(mockMoveFile).toHaveBeenCalledWith(
      '/cache/hls_segments/finalized.mp4',
      '/saved/movie.mp4',
    );
    expect(mockCopyFile).not.toHaveBeenCalled();
    expect(completed).toHaveBeenCalledWith('/saved/movie.mp4');
  });

  it('keeps fMP4 initialization changes and discontinuities in the local playlist', async () => {
    mockAxiosGet.mockResolvedValue({
      data: [
        '#EXTM3U',
        '#EXT-X-MAP:URI="init-a.mp4"',
        '#EXTINF:3,',
        'one.m4s',
        '#EXT-X-DISCONTINUITY',
        '#EXT-X-MAP:URI="init-b.mp4"',
        '#EXTINF:4,',
        'two.m4s',
        '#EXT-X-ENDLIST',
      ].join('\n'),
    });
    await download();
    const text = mockWriteFile.mock.calls.find(call => String(call[0]).endsWith('/video.m3u8'))![1] as string;
    expect(text).toContain(
      '#EXT-X-MAP:URI="video_init_0.mp4"\n#EXTINF:3,\nvideo_0.ts',
    );
    expect(text).toContain(
      '#EXT-X-DISCONTINUITY\n#EXT-X-MAP:URI="video_init_1.mp4"\n#EXTINF:4,\nvideo_1.ts',
    );
    const fetched = mockDownloadFile.mock.calls.map(c => c[0].fromUrl);
    expect(fetched).toEqual(
      expect.arrayContaining([
        'https://example.com/init-a.mp4',
        'https://example.com/init-b.mp4',
      ]),
    );
  });

  it('passes both offline playlists to the finalizer for separate audio', async () => {
    mockAxiosGet.mockImplementation(async url => ({
      data: url.endsWith('/video.m3u8')
        ? [
            '#EXTM3U',
            '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",DEFAULT=YES,URI="audio.m3u8"',
            '#EXT-X-STREAM-INF:BANDWIDTH=10,AUDIO="aud"',
            'track.m3u8',
          ].join('\n')
        : playlist(),
    }));
    await download();
    expect(mockFinalizeHls).toHaveBeenCalledWith(
      '/cache/hls_segments/video.m3u8',
      '/cache/hls_segments/audio.m3u8',
      '/cache/hls_segments/finalized.mp4',
    );
  });

  it('deletes the segments before moving the finalized MP4 into place', async () => {
    mockAxiosGet.mockResolvedValue({
      data: [
        '#EXTM3U',
        '#EXT-X-MAP:URI="init.mp4"',
        '#EXTINF:3,',
        'one.m4s',
        '#EXTINF:4,',
        'two.m4s',
        '#EXT-X-ENDLIST',
      ].join('\n'),
    });
    await download();
    const deleted = mockUnlink.mock.calls.map(call => call[0]);
    expect(deleted).toEqual(
      expect.arrayContaining([
        '/cache/hls_segments/video_0.ts',
        '/cache/hls_segments/video_1.ts',
        '/cache/hls_segments/video_init_0.mp4',
        '/cache/hls_segments/video.m3u8',
      ]),
    );
    expect(deleted).not.toContain('/cache/hls_segments/finalized.mp4');
    expect(mockMoveFile).toHaveBeenCalledWith(
      '/cache/hls_segments/finalized.mp4',
      '/cache/movie.mp4',
    );
    const segmentsDeleted =
      mockUnlink.mock.invocationCallOrder[
        deleted.indexOf('/cache/hls_segments/video_1.ts')
      ];
    expect(segmentsDeleted).toBeLessThan(
      mockMoveFile.mock.invocationCallOrder[mockMoveFile.mock.calls.findIndex(call => String(call[0]).endsWith('/finalized.mp4'))],
    );
  });

  it('copies the finalized MP4 when moving it fails', async () => {
    mockAxiosGet.mockResolvedValue({data: playlist()});
    mockMoveFile.mockImplementation(async (...args) => {if (String(args[0]).endsWith('/finalized.mp4')) throw new Error('EXDEV');});
    const completed = jest.fn();
    await hlsDownloader2({
      videoUrl: 'https://example.com/video.m3u8',
      downloadId: 'fallback',
      path: '/saved/movie.mp4',
      title: 'Movie',
      onCompleted: completed,
    });
    expect(mockCopyFile).toHaveBeenCalledWith(
      '/cache/hls_segments/finalized.mp4',
      '/saved/movie.mp4',
    );
    expect(completed).toHaveBeenCalledWith('/saved/movie.mp4');
  });

  it('does not publish raw segments when finalization fails', async () => {
    mockAxiosGet.mockResolvedValue({data: playlist()});
    mockFinalizeHls.mockRejectedValue(new Error('remux failed'));
    await expect(download()).rejects.toThrow('remux failed');
    expect(mockCopyFile).not.toHaveBeenCalled();
    expect(mockMoveFile.mock.calls.some(call => call[0] === '/cache/hls_segments/finalized.mp4')).toBe(false);
  });

  it.each([0, -1, NaN])(
    'rejects an invalid finalized duration %s',
    async duration => {
      mockAxiosGet.mockResolvedValue({data: playlist()});
      mockFinalizeHls.mockResolvedValue({duration});
      await expect(download()).rejects.toThrow('no valid duration');
      expect(mockCopyFile).not.toHaveBeenCalled();
      expect(mockMoveFile.mock.calls.some(call => call[0] === '/cache/hls_segments/finalized.mp4')).toBe(false);
    },
  );

  const separateAudio = () =>
    mockAxiosGet.mockImplementation(async url => ({
      data: url.endsWith('/video.m3u8')
        ? [
            '#EXTM3U',
            '#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="aud",DEFAULT=YES,URI="audio.m3u8"',
            '#EXT-X-STREAM-INF:BANDWIDTH=10,AUDIO="aud"',
            'track.m3u8',
          ].join('\n')
        : playlist(),
    }));

  it('keeps the video when muxing the separate audio fails', async () => {
    separateAudio();
    mockFinalizeHls
      .mockRejectedValueOnce(new Error('audio mux failed'))
      .mockResolvedValueOnce({duration: 10});
    const completed = jest.fn();
    await hlsDownloader2({
      videoUrl: 'https://example.com/video.m3u8',
      downloadId: 'audio-fallback',
      path: '/saved/movie.mp4',
      title: 'Movie',
      onCompleted: completed,
    });
    expect(mockFinalizeHls).toHaveBeenCalledTimes(2);
    expect(mockFinalizeHls).toHaveBeenLastCalledWith(
      '/cache/hls_segments/video.m3u8',
      null,
      '/cache/hls_segments/finalized.mp4',
    );
    expect(completed).toHaveBeenCalledWith('/saved/movie.mp4');
  });

  it('validates the duration of the video-only retry', async () => {
    separateAudio();
    mockFinalizeHls
      .mockRejectedValueOnce(new Error('audio mux failed'))
      .mockResolvedValueOnce({duration: 0});
    await expect(download()).rejects.toThrow('no valid duration');
    expect(mockCopyFile).not.toHaveBeenCalled();
  });

  it('fails when the video-only retry fails too', async () => {
    separateAudio();
    mockFinalizeHls
      .mockRejectedValueOnce(new Error('audio mux failed'))
      .mockRejectedValueOnce(new Error('video mux failed'));
    await expect(download()).rejects.toThrow('video mux failed');
    expect(mockFinalizeHls).toHaveBeenCalledTimes(2);
    expect(mockCopyFile).not.toHaveBeenCalled();
  });

  it('does not retry without audio when the download was cancelled', async () => {
    separateAudio();
    mockFinalizeHls.mockImplementationOnce(async () => {
      cancelHlsDownload('movie');
      throw new Error('audio mux failed');
    });
    await expect(download()).rejects.toThrow('Download cancelled');
    expect(mockFinalizeHls).toHaveBeenCalledTimes(1);
    expect(mockCopyFile).not.toHaveBeenCalled();
  });
});

const mockBackendStart = jest.fn();
const mockGetStream = jest.fn();
const mockDestinationEmpty = jest.fn();

jest.mock('../src/lib/downloadBackends/registry', () => ({
  getDownloadBackend: () => ({
    start: mockBackendStart,
    pause: jest.fn(async () => undefined),
    resume: jest.fn(async () => undefined),
    cancel: jest.fn(async () => undefined),
    cleanup: jest.fn(async () => undefined),
  }),
}));

jest.mock('../src/lib/services/ProviderManager', () => ({
  providerManager: {getStream: mockGetStream},
}));

jest.mock('../src/lib/downloadDestination', () => ({
  isDownloadDestinationEmpty: (...args: unknown[]) => mockDestinationEmpty(...args),
  prepareDownloadDestination: async () => ({
    stagingDirectory: '/cache/downloads/episode',
    stagingPath: '/cache/downloads/episode/Episode.mp4.part',
  }),
  finalizeDownloadOutput: async () => ({
    filePath: 'content://downloads/Episode.mp4',
    finalDocumentUri: 'content://downloads/Episode.mp4',
    size: 100,
  }),
  cleanupDownloadStaging: async () => undefined,
}));

jest.mock('../src/lib/downloadLocation', () => ({
  ensureDownloadLocationAccess: async (location: unknown) => location,
  isSafDownloadLocation: () => true,
}));

jest.mock('../src/lib/services/Notification', () => ({
  notificationService: {
    ensureDownloadPermission: jest.fn(async () => true),
    startForegroundTask: jest.fn(),
    stopForegroundTask: jest.fn(async () => undefined),
    showDownloadStarting: jest.fn(async () => undefined),
    showDownloadQueued: jest.fn(async () => undefined),
    showDownloadProgress: jest.fn(async () => undefined),
    showDownloadComplete: jest.fn(async () => undefined),
    showDownloadFailed: jest.fn(async () => undefined),
    cancelNotification: jest.fn(async () => undefined),
  },
}));

jest.mock('../src/lib/imageAccent', () => ({
  getImageAccent: jest.fn(async () => '#ffffff'),
}));

jest.mock('../src/lib/storage', () => ({
  settingsStorage: {
    getDownloadLocationConfig: () => undefined,
    getDownloadConcurrency: () => 2,
    getPrimaryColor: () => '#ffffff',
    setDownloadLocation: jest.fn(),
  },
}));

jest.mock('react-native-mmkv-storage', () => ({
  MMKVLoader: class {
    withInstanceID() {
      return this;
    }
    initialize() {
      return {
        getString: () => undefined,
        setString: () => undefined,
        getBool: () => undefined,
        setBool: () => undefined,
        getInt: () => undefined,
        setInt: () => undefined,
        removeItem: () => undefined,
        clearStore: () => undefined,
      };
    }
  },
}));

import {cancelDownload, retryDownload, startDownload} from '../src/lib/downloadManager';
import {
  isExpiredLinkError,
  pickRefreshedStream,
  refreshDownloadSource,
} from '../src/lib/downloadSourceRefresh';
import useDownloadsStore from '../src/lib/zustand/downloadsStore';

const location = {
  type: 'saf' as const,
  uri: 'content://downloads/tree',
  label: 'Downloads',
};

const enqueueEpisode = (overrides: Record<string, unknown> = {}) =>
  useDownloadsStore.getState().enqueueDownload({
    id: 'episode',
    title: 'Episode',
    type: 'series',
    url: 'https://files.example/old.mkv',
    headers: {Cookie: 'cf_clearance=old'},
    server: 'HubCloud',
    provider: 'vega',
    sourceLink: 'https://site.example/episode-1',
    sourceType: 'http',
    videoType: 'mkv',
    downloadLocation: location,
    ...overrides,
  });

const startedUrls = () =>
  mockBackendStart.mock.calls.map(([context]) => context.record.url);

describe('expired download links', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    useDownloadsStore.setState({downloads: {}, storageFullHold: false});
    mockDestinationEmpty.mockReset().mockResolvedValue(true);
    mockGetStream.mockResolvedValue([
      {server: 'GDFlix', link: 'https://other.example/x.mkv', type: 'mkv'},
      {
        server: 'HubCloud',
        link: 'https://files.example/new.mkv',
        type: 'mkv',
        headers: {Cookie: 'cf_clearance=new'},
      },
    ]);
  });

  afterEach(() => jest.restoreAllMocks());

  it('fetches a fresh link from the same server and starts again', async () => {
    mockBackendStart
      .mockRejectedValueOnce(new Error('HTTP 403'))
      .mockResolvedValueOnce(undefined);
    enqueueEpisode();

    await startDownload('episode', location);

    expect(mockGetStream).toHaveBeenCalledWith(
      expect.objectContaining({
        link: 'https://site.example/episode-1',
        providerValue: 'vega',
        isDownload: true,
      }),
    );
    expect(startedUrls()).toEqual([
      'https://files.example/old.mkv',
      'https://files.example/new.mkv',
    ]);
    expect(mockBackendStart.mock.calls[1][0].record.headers).toEqual({
      Cookie: 'cf_clearance=new',
    });
    expect(useDownloadsStore.getState().downloads.episode.status).toBe(
      'completed',
    );
  });

  it('fails with the original error when the server is not listed again', async () => {
    mockBackendStart.mockRejectedValue(new Error('HTTP 403'));
    mockGetStream.mockResolvedValue([
      {server: 'GDFlix', link: 'https://other.example/x.mkv', type: 'mkv'},
    ]);
    enqueueEpisode();

    await expect(startDownload('episode', location)).rejects.toThrow(
      'HTTP 403',
    );

    expect(mockBackendStart).toHaveBeenCalledTimes(1);
    expect(useDownloadsStore.getState().downloads.episode).toMatchObject({
      status: 'error',
      url: 'https://files.example/old.mkv',
    });
  });

  it('keeps the old link when the provider request fails', async () => {
    mockBackendStart.mockRejectedValue(new Error('HTTP status 403'));
    mockGetStream.mockRejectedValue(new Error('Network error'));
    enqueueEpisode({sourceType: 'hls', videoType: 'mp4'});

    await expect(startDownload('episode', location)).rejects.toThrow(
      'HTTP status 403',
    );
    expect(mockBackendStart).toHaveBeenCalledTimes(1);
  });

  it('does not refresh after other errors or once data has arrived', async () => {
    mockBackendStart.mockRejectedValueOnce(new Error('HTTP 500'));
    enqueueEpisode();
    await expect(startDownload('episode', location)).rejects.toThrow();

    mockBackendStart.mockImplementationOnce(async ({record}) => {
      useDownloadsStore.getState().updateProgress(record.id, 50, 100, 0);
      throw new Error('HTTP 403');
    });
    enqueueEpisode();
    await expect(startDownload('episode', location)).rejects.toThrow();

    expect(mockGetStream).not.toHaveBeenCalled();
  });

  it('fetches a fresh link when an expired download is retried', async () => {
    mockBackendStart.mockRejectedValue(new Error('HTTP 410'));
    mockGetStream.mockRejectedValueOnce(new Error('Timed out'));
    enqueueEpisode();
    await expect(startDownload('episode', location)).rejects.toThrow();

    mockBackendStart.mockReset();
    mockBackendStart.mockRejectedValueOnce(new Error('HTTP 410')).mockResolvedValueOnce(undefined);
    await retryDownload('episode');
    await new Promise(resolve => setImmediate(resolve));
    await new Promise(resolve => setImmediate(resolve));

    expect(startedUrls()).toEqual(['https://files.example/old.mkv', 'https://files.example/new.mkv']);
  });

  it('keeps the original URL when actual destination bytes cannot be ruled out', async () => {
    mockBackendStart.mockRejectedValue(new Error('HTTP 403'));
    mockDestinationEmpty.mockResolvedValue(false);
    enqueueEpisode();
    await expect(startDownload('episode', location)).rejects.toThrow('HTTP 403');
    expect(mockGetStream).not.toHaveBeenCalled();
    expect(startedUrls()).toEqual(['https://files.example/old.mkv']);
  });

  it('checks the destination again after awaiting the provider', async () => {
    mockBackendStart.mockRejectedValue(new Error('HTTP 403'));
    mockDestinationEmpty.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    enqueueEpisode();
    await expect(startDownload('episode', location)).rejects.toThrow('HTTP 403');
    expect(mockGetStream).toHaveBeenCalledTimes(1);
    expect(startedUrls()).toEqual(['https://files.example/old.mkv']);
    expect(useDownloadsStore.getState().downloads.episode.url).toBe('https://files.example/old.mkv');
  });

  it('aborts refresh on cancellation and ignores a late provider result', async () => {
    let resolve!: (value: unknown) => void;
    mockBackendStart.mockRejectedValue(new Error('HTTP 403'));
    mockGetStream.mockImplementation(() => new Promise(done => { resolve = done; }));
    enqueueEpisode();
    const start = startDownload('episode', location);
    for (let i = 0; i < 5; i++) await new Promise(done => setImmediate(done));
    const signal = mockGetStream.mock.calls[0][0].signal as AbortSignal;
    await cancelDownload('episode');
    await start;
    expect(signal.aborted).toBe(true);
    expect(useDownloadsStore.getState().downloads.episode).toBeUndefined();
    enqueueEpisode({url: 'https://files.example/user-replacement.mkv', status: 'paused'});
    resolve([{server: 'HubCloud', link: 'https://files.example/stale.mkv', type: 'mkv'}]);
    await new Promise(done => setImmediate(done));
    expect(useDownloadsStore.getState().downloads.episode.url).toBe('https://files.example/user-replacement.mkv');
    expect(mockBackendStart).toHaveBeenCalledTimes(1);
  });

  it('keeps a Retry refresh inside the cancellable download lifecycle', async () => {
    mockBackendStart.mockRejectedValue(new Error('HTTP 403'));
    mockGetStream.mockRejectedValueOnce(new Error('Provider offline'));
    enqueueEpisode();
    await expect(startDownload('episode', location)).rejects.toThrow();
    mockGetStream.mockImplementation(() => new Promise(() => {}));
    await retryDownload('episode');
    for (let i = 0; i < 5; i++) await new Promise(done => setImmediate(done));
    const signal = mockGetStream.mock.calls[1][0].signal as AbortSignal;
    await cancelDownload('episode');
    for (let i = 0; i < 5; i++) await new Promise(done => setImmediate(done));
    expect(signal.aborted).toBe(true);
    expect(useDownloadsStore.getState().downloads.episode).toBeUndefined();
    expect(mockBackendStart).toHaveBeenCalledTimes(2);
  });

  it('times out even when a provider ignores its abort signal', async () => {
    jest.useFakeTimers();
    try {
      enqueueEpisode();
      mockGetStream.mockImplementation(() => new Promise(() => {}));
      const pending = refreshDownloadSource(useDownloadsStore.getState().downloads.episode);
      await jest.advanceTimersByTimeAsync(45_000);
      await expect(pending).resolves.toBeUndefined();
      expect(mockGetStream.mock.calls[0][0].signal.aborted).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });

  it('never refreshes torrents or subtitles', async () => {
    mockBackendStart.mockRejectedValue(new Error('HTTP 403'));
    enqueueEpisode({sourceType: 'torrent', url: 'magnet:?xt=urn:btih:abc'});
    await expect(startDownload('episode', location)).rejects.toThrow();
    expect(mockGetStream).not.toHaveBeenCalled();
    enqueueEpisode({isSubtitle: true, sourceType: 'http', url: 'https://files.example/sub.srt'});
    await expect(startDownload('episode', location)).rejects.toThrow();
    expect(mockGetStream).not.toHaveBeenCalled();
  });
});

describe('download link refresh helpers', () => {
  it('does not guess a known quality for an older record without saved quality', () => {
    const record: any = {server: 'HubCloud', sourceType: 'http', videoType: 'mkv', url: 'old'};
    expect(pickRefreshedStream([
      {server: 'HubCloud', type: 'mkv', link: 'new', quality: '480'},
    ], record)).toBeUndefined();
  });

  it('rejects ambiguous same-container replacements without a known quality', () => {
    const record: any = {server: 'HubCloud', sourceType: 'http', videoType: 'mkv', url: 'old'};
    expect(pickRefreshedStream([
      {server: 'HubCloud', type: 'mkv', link: '480', quality: '480'},
      {server: 'HubCloud', type: 'mkv', link: '1080', quality: '1080'},
    ], record)).toBeUndefined();
  });

  it('matches persisted quality and container, rejecting other variants', () => {
    const record: any = {server: 'HubCloud', sourceType: 'http', videoType: 'mkv', quality: '1080p', url: 'old'};
    const selected = {server: 'HubCloud', type: 'mkv', link: 'right', quality: '1080'};
    expect(pickRefreshedStream([
      {server: 'HubCloud', type: 'mp4', link: 'wrong-format', quality: '1080'},
      {server: 'HubCloud', type: 'mkv', link: 'wrong-quality', quality: '480'}, selected,
    ], record)).toEqual(selected);
  });

  it('rejects multiple releases of the same quality', () => {
    const record: any = {server: 'HubCloud', sourceType: 'http', videoType: 'mkv', quality: '1080', url: 'old'};
    expect(pickRefreshedStream([
      {server: 'HubCloud', type: 'mkv', link: 'release-a', quality: '1080'},
      {server: 'HubCloud', type: 'mkv', link: 'release-b', quality: '1080'},
    ], record)).toBeUndefined();
  });

  it('retains an exact URL for header-only refresh despite other variants', () => {
    const record: any = {server: 'HubCloud', sourceType: 'http', videoType: 'mkv', url: 'same'};
    const exact = {server: 'HubCloud', type: 'mkv', link: 'same', headers: {Cookie: 'new'}};
    expect(pickRefreshedStream([
      {server: 'HubCloud', type: 'mkv', link: 'different'}, exact,
    ], record)).toEqual(exact);
  });

  it('recognises expired link errors from each backend', () => {
    expect(isExpiredLinkError('HTTP 403')).toBe(true);
    expect(isExpiredLinkError('HTTP status 410')).toBe(true);
    expect(isExpiredLinkError('Request failed with status: 401')).toBe(true);
    expect(isExpiredLinkError('HTTP 404')).toBe(true);
    expect(isExpiredLinkError('HTTP 500')).toBe(false);
    expect(isExpiredLinkError('write failed: ENOSPC')).toBe(false);
    expect(isExpiredLinkError(undefined)).toBe(false);
  });

  it('only accepts the same server with the same kind of stream', () => {
    const record: any = {
      server: 'HubCloud',
      sourceType: 'hls',
      url: 'https://a.example/old.m3u8',
    };
    expect(
      pickRefreshedStream(
        [
          {server: 'HubCloud', link: 'https://a.example/x.mkv', type: 'mkv'},
          {server: 'Other', link: 'https://b.example/y.m3u8', type: 'm3u8'},
        ],
        record,
      ),
    ).toBeUndefined();
    expect(
      pickRefreshedStream(
        [
          {
            server: 'HubCloud',
            link: 'https://a.example/new.m3u8',
            type: 'm3u8',
          },
        ],
        record,
      )?.link,
    ).toBe('https://a.example/new.m3u8');
  });
});

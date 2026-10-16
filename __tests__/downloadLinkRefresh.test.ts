const mockBackendStart = jest.fn();
let mockAutoServerFallback = true;
let mockHlsResume = false;
const mockGetStream = jest.fn();
const mockDestinationEmpty = jest.fn();
const mockDiscardDestination = jest.fn();
const mockBackendCleanup = jest.fn();
const mockPrepareDestination = jest.fn(async () => ({
  stagingDirectory: '/cache/downloads/episode',
  stagingPath: '/cache/downloads/episode/Episode.mp4.part',
}));

jest.mock('../src/lib/downloadBackends/registry', () => ({
  getDownloadBackend: (source: string) => ({
    preserveStagingOnFailure: mockHlsResume && source === 'hls',
    start: mockBackendStart,
    pause: jest.fn(async () => undefined),
    resume: jest.fn(async () => undefined),
    cancel: jest.fn(async () => undefined),
    cleanup: (...args: unknown[]) => mockBackendCleanup(...args),
  }),
}));

jest.mock('../src/lib/services/ProviderManager', () => ({
  providerManager: {getStream: mockGetStream},
}));

jest.mock('../src/lib/downloadDestination', () => ({
  isDownloadDestinationEmpty: (...args: unknown[]) => mockDestinationEmpty(...args),
  discardDownloadDestination: (...args: unknown[]) => mockDiscardDestination(...args),
  prepareDownloadDestination: (...args: unknown[]) => mockPrepareDestination(...args),
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
    isAutoDownloadServerFallbackEnabled: () => mockAutoServerFallback,
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
    mockAutoServerFallback = true;
    mockHlsResume = false;
    mockBackendStart.mockReset().mockResolvedValue(undefined);
    mockBackendCleanup.mockReset().mockResolvedValue(undefined);
    mockDiscardDestination.mockReset().mockResolvedValue(undefined);
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

  it('does not look up another server when automatic fallback is disabled', async () => {
    mockAutoServerFallback = false;
    enqueueEpisode();
    mockBackendStart.mockRejectedValue(new Error('HTTP 500'));

    await expect(startDownload('episode', location)).rejects.toThrow('HTTP 500');

    expect(mockGetStream).not.toHaveBeenCalled();
    expect(mockDiscardDestination).not.toHaveBeenCalled();
    expect(mockBackendStart).toHaveBeenCalledTimes(1);
  });

  it('respects disabling fallback while an alternate-server lookup is pending', async () => {
    enqueueEpisode();
    mockBackendStart.mockRejectedValue(new Error('HTTP 500'));
    let finishLookup!: (streams: unknown[]) => void;
    mockGetStream.mockImplementationOnce(() => new Promise(resolve => {
      finishLookup = resolve;
    }));
    const start = startDownload('episode', location);
    for (let i = 0; i < 5; i++) await new Promise(done => setImmediate(done));
    expect(mockGetStream).toHaveBeenCalledTimes(1);
    mockAutoServerFallback = false;
    finishLookup([{server: 'Other', link: 'https://other.example/video.mkv', type: 'mkv'}]);

    await expect(start).rejects.toThrow('HTTP 500');

    expect(mockPrepareDestination).toHaveBeenCalledTimes(1);
    expect(mockDiscardDestination).not.toHaveBeenCalled();
    expect(mockBackendStart).toHaveBeenCalledTimes(1);
  });

  it.each([true, false])('refreshes the same server with automatic fallback set to %s', async enabled => {
    mockAutoServerFallback = enabled;
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

  it('refreshes an expired HLS link with saved segments and delegates revalidation to the downloader', async () => {
    mockHlsResume = true;
    mockDestinationEmpty.mockResolvedValue(false);
    enqueueEpisode({sourceType: 'hls', videoType: 'mp4', downloadedBytes: 3, totalBytes: 10});
    mockBackendStart.mockRejectedValueOnce(new Error('HTTP 403')).mockResolvedValueOnce(undefined);
    mockGetStream.mockResolvedValue([{server: 'HubCloud', link: 'https://files.example/new.m3u8', type: 'm3u8'}]);
    await startDownload('episode', location);
    expect(mockBackendStart).toHaveBeenCalledTimes(2);
    expect(mockBackendStart.mock.calls[1][0].record.url).toBe('https://files.example/new.m3u8');
    expect(mockBackendCleanup).not.toHaveBeenCalled();
  });

  it('fails with the original error when the server is not listed again', async () => {
    mockBackendStart.mockRejectedValue(new Error('HTTP 403'));
    mockGetStream.mockResolvedValue([
      {server: 'GDFlix', link: 'https://other.example/x.mp4', type: 'mp4'},
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

  it('does not reuse the same server for nonexpired errors or switch after significant progress', async () => {
    mockGetStream.mockResolvedValue([
      {server: 'HubCloud', link: 'https://files.example/new.mkv', type: 'mkv'},
    ]);
    mockBackendStart.mockRejectedValueOnce(new Error('HTTP 500'));
    enqueueEpisode();
    await expect(startDownload('episode', location)).rejects.toThrow();

    mockBackendStart.mockImplementationOnce(async ({record}) => {
      useDownloadsStore.getState().updateProgress(record.id, 50, 100, 0);
      throw new Error('HTTP 403');
    });
    enqueueEpisode();
    await expect(startDownload('episode', location)).rejects.toThrow();

    expect(mockGetStream).toHaveBeenCalledTimes(1);
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
    mockGetStream.mockResolvedValue([
      {server: 'HubCloud', link: 'https://files.example/new.mkv', type: 'mkv'},
    ]);
    mockBackendStart.mockRejectedValue(new Error('HTTP 403'));
    mockDestinationEmpty.mockResolvedValue(false);
    enqueueEpisode();
    await expect(startDownload('episode', location)).rejects.toThrow('HTTP 403');
    expect(mockGetStream).toHaveBeenCalledTimes(1);
    expect(mockDiscardDestination).not.toHaveBeenCalled();
    expect(startedUrls()).toEqual(['https://files.example/old.mkv']);
  });

  it('checks the destination again after awaiting the provider', async () => {
    mockGetStream.mockResolvedValue([
      {server: 'HubCloud', link: 'https://files.example/new.mkv', type: 'mkv'},
    ]);
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

  it('switches servers below one percent and resets partials before starting again', async () => {
    enqueueEpisode();
    mockBackendStart.mockImplementationOnce(async ({record}) => {
      useDownloadsStore.getState().updateProgress(record.id, 99, 10000, 10);
      throw new Error('HTTP 500');
    }).mockResolvedValueOnce(undefined);
    await startDownload('episode', location);
    expect(startedUrls()).toEqual(['https://files.example/old.mkv', 'https://other.example/x.mkv']);
    expect(mockGetStream).toHaveBeenCalledTimes(1);
    expect(mockDiscardDestination).toHaveBeenCalledTimes(1);
    expect(mockPrepareDestination).toHaveBeenCalledTimes(2);
    expect(mockBackendStart.mock.calls[1][0].record).toMatchObject({
      server: 'GDFlix', downloadedBytes: 0, totalBytes: 0,
    });
    expect(mockBackendCleanup.mock.invocationCallOrder[0]).toBeLessThan(mockDiscardDestination.mock.invocationCallOrder[0]);
    expect(mockDiscardDestination.mock.invocationCallOrder[0]).toBeLessThan(mockBackendStart.mock.invocationCallOrder[1]);
    expect(useDownloadsStore.getState().downloads.episode.status).toBe('completed');
  });

  it.each([[100, 10000], [101, 10000], [1, 0]])(
    'does not switch at or above one percent or when nonzero progress is unknown (%s/%s)',
    async (downloaded, total) => {
      enqueueEpisode();
      mockBackendStart.mockImplementationOnce(async ({record}) => {
        useDownloadsStore.getState().updateProgress(record.id, downloaded, total, 0);
        throw new Error('HTTP 500');
      });
      await expect(startDownload('episode', location)).rejects.toThrow('HTTP 500');
      expect(mockGetStream).not.toHaveBeenCalled();
      expect(mockDiscardDestination).not.toHaveBeenCalled();
    },
  );

  it('tries each alternate server once without fetching the list repeatedly', async () => {
    enqueueEpisode();
    mockGetStream.mockResolvedValue([
      {server: 'HubCloud', link: 'https://a/new.mkv', type: 'mkv'},
      {server: 'B', link: 'https://b/video.mkv', type: 'mkv'},
      {server: 'C', link: 'https://c/video.mkv', type: 'mkv'},
    ]);
    mockBackendStart.mockRejectedValueOnce(new Error('HTTP 500'))
      .mockRejectedValueOnce(new Error('HTTP 500')).mockResolvedValueOnce(undefined);
    await startDownload('episode', location);
    expect(startedUrls()).toEqual(['https://files.example/old.mkv', 'https://b/video.mkv', 'https://c/video.mkv']);
    expect(mockGetStream).toHaveBeenCalledTimes(1);
    expect(mockDiscardDestination).toHaveBeenCalledTimes(2);
  });

  it('stops after exhausting compatible servers instead of looping', async () => {
    enqueueEpisode();
    mockBackendStart.mockRejectedValue(new Error('HTTP 500'));
    await expect(startDownload('episode', location)).rejects.toThrow('HTTP 500');
    expect(startedUrls()).toEqual(['https://files.example/old.mkv', 'https://other.example/x.mkv']);
    expect(mockGetStream).toHaveBeenCalledTimes(1);
  });

  it('keeps the queue on hold for storage exhaustion without trying a new server', async () => {
    enqueueEpisode();
    mockBackendStart.mockRejectedValue(new Error('ENOSPC'));
    await expect(startDownload('episode', location)).rejects.toThrow('ENOSPC');
    expect(mockGetStream).not.toHaveBeenCalled();
    expect(mockDiscardDestination).not.toHaveBeenCalled();
    expect(useDownloadsStore.getState().storageFullHold).toBe(true);
  });

  it('does not start another server if partial cleanup cannot be verified', async () => {
    enqueueEpisode();
    mockBackendStart.mockRejectedValue(new Error('HTTP 500'));
    mockDiscardDestination.mockRejectedValue(new Error('Unable to clear destination'));
    await expect(startDownload('episode', location)).rejects.toThrow('Unable to clear destination');
    expect(mockBackendStart).toHaveBeenCalledTimes(1);
  });

  it('cancels an alternate-server lookup without starting another download', async () => {
    enqueueEpisode();
    mockBackendStart.mockRejectedValue(new Error('HTTP 500'));
    mockGetStream.mockImplementation(() => new Promise(() => {}));
    const start = startDownload('episode', location);
    for (let i = 0; i < 5; i++) await new Promise(done => setImmediate(done));
    const signal = mockGetStream.mock.calls[0][0].signal as AbortSignal;
    await cancelDownload('episode');
    await start;
    expect(signal.aborted).toBe(true);
    expect(mockDiscardDestination).not.toHaveBeenCalled();
    expect(mockBackendStart).toHaveBeenCalledTimes(1);
    expect(useDownloadsStore.getState().downloads.episode).toBeUndefined();
  });

  it('does not create another destination when cancelled during partial cleanup', async () => {
    enqueueEpisode();
    mockBackendStart.mockRejectedValue(new Error('HTTP 500'));
    let finishCleanup!: () => void;
    mockBackendCleanup.mockImplementationOnce(() => new Promise<void>(resolve => { finishCleanup = resolve; }));
    const start = startDownload('episode', location);
    for (let i = 0; i < 5; i++) await new Promise(done => setImmediate(done));
    await cancelDownload('episode');
    finishCleanup();
    await start;
    expect(mockPrepareDestination).toHaveBeenCalledTimes(1);
    expect(mockDiscardDestination).not.toHaveBeenCalled();
    expect(mockBackendStart).toHaveBeenCalledTimes(1);
    expect(useDownloadsStore.getState().downloads.episode).toBeUndefined();
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

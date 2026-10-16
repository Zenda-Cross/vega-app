const mockBackendStart = jest.fn(async () => undefined);
const mockBackendCancel = jest.fn(async () => undefined);
const mockBackendCleanup = jest.fn(async () => undefined);
const mockBackendPause = jest.fn(async () => undefined);
const mockBackendResume = jest.fn(async () => undefined);
let mockDownloadConcurrency = 2;
let mockResumableHls = false;

jest.mock('../src/lib/downloadBackends/registry', () => ({
  getDownloadBackend: (source: string) => ({
    preserveStagingOnFailure: mockResumableHls && source === 'hls',
    restartOnResume: mockResumableHls && source === 'hls',
    start: mockBackendStart,
    pause: mockBackendPause,
    resume: mockBackendResume,
    cancel: mockBackendCancel,
    cleanup: mockBackendCleanup,
  }),
}));

jest.mock('../src/lib/downloadDestination', () => ({
  prepareDownloadDestination: async () => ({
    stagingDirectory: '/cache/downloads/movie',
    stagingPath: '/cache/downloads/movie/Movie.mp4.part',
  }),
  finalizeDownloadOutput: async () => ({
    filePath: 'content://downloads/Movie.mp4',
    finalDocumentUri: 'content://downloads/Movie.mp4',
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
    getDownloadConcurrency: () => mockDownloadConcurrency,
    isAutoDownloadServerFallbackEnabled: () => true,
    setDownloadConcurrency: (value: number) => { mockDownloadConcurrency = value; },
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

import {
  cancelDownload,
  pauseDownload,
  resumeDownload,
  retryDownload,
  scheduleQueuedDownloads,
  startDownload,
  startQueuedDownloadNow,
  updateDownloadConcurrency,
} from '../src/lib/downloadManager';
import {DownloadPausedError} from '../src/lib/downloadBackends/types';
import {notificationService} from '../src/lib/services/Notification';
import useDownloadsStore from '../src/lib/zustand/downloadsStore';

const mockStartForegroundTask =
  notificationService.startForegroundTask as jest.Mock;
const mockStopForegroundTask =
  notificationService.stopForegroundTask as jest.Mock;
const mockShowStarting = notificationService.showDownloadStarting as jest.Mock;
const mockShowQueued = notificationService.showDownloadQueued as jest.Mock;
const mockShowComplete = notificationService.showDownloadComplete as jest.Mock;
const mockShowFailed = notificationService.showDownloadFailed as jest.Mock;
const mockCancelNotification =
  notificationService.cancelNotification as jest.Mock;

const location = {
  type: 'saf' as const,
  uri: 'content://downloads/tree',
  label: 'Downloads',
};

const flushAsyncWork = () =>
  new Promise<void>(resolve => setImmediate(resolve));

const enqueueDownload = () =>
  useDownloadsStore.getState().enqueueDownload({
    id: 'movie_direct_0',
    title: 'Movie',
    type: 'movie',
    url: 'https://example.com/movie.mp4',
    sourceType: 'http',
    videoType: 'mp4',
  });

describe('download manager foreground lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDownloadsStore.setState({downloads: {}, storageFullHold: false});
    mockBackendStart.mockResolvedValue(undefined);
    mockBackendPause.mockResolvedValue(undefined);
    mockBackendResume.mockResolvedValue(undefined);
    mockShowStarting.mockResolvedValue(undefined);
    mockDownloadConcurrency = 2;
    mockResumableHls = false;
  });

  it('pauses an HLS job without deleting progress and safely queues an immediate resume', async () => {
    mockResumableHls = true;
    enqueueDownload();
    useDownloadsStore.getState().updateDownload('movie_direct_0', {sourceType: 'hls'});
    let stop!: (error: Error) => void;
    mockBackendStart.mockImplementationOnce(() => new Promise<void>((_resolve, reject) => {stop = reject;}));
    const running = startDownload('movie_direct_0', location);
    await flushAsyncWork();
    useDownloadsStore.getState().updateDownload('movie_direct_0', {status: 'downloading', canPause: true});
    mockBackendPause.mockImplementationOnce(async () => {
      setTimeout(() => stop(new DownloadPausedError()), 0);
    });
    await pauseDownload('movie_direct_0');
    expect(useDownloadsStore.getState().downloads.movie_direct_0.status).toBe('paused');
    await resumeDownload('movie_direct_0');
    await running;
    await flushAsyncWork();
    expect(mockBackendStart).toHaveBeenCalledTimes(2);
    expect(mockBackendResume).not.toHaveBeenCalled();
    expect(mockBackendCleanup).not.toHaveBeenCalled();
    expect(mockShowFailed).not.toHaveBeenCalled();
    expect(useDownloadsStore.getState().downloads.movie_direct_0.status).toBe('completed');
  });

  it('releases tracking after successful completion', async () => {
    enqueueDownload();

    await startDownload('movie_direct_0', location);

    expect(mockStartForegroundTask).toHaveBeenCalledWith('movie_direct_0');
    expect(mockShowComplete).toHaveBeenCalledWith(
      'Movie',
      'movie_direct_0',
      'http',
      '#ffffff',
    );
    expect(mockStopForegroundTask).toHaveBeenCalledWith('movie_direct_0');
  });

  it('continues downloading when Android blocks foreground service startup', async () => {
    enqueueDownload();
    mockStartForegroundTask.mockRejectedValueOnce(
      new Error('ForegroundServiceStartNotAllowedException'),
    );

    await startDownload('movie_direct_0', location);

    expect(mockBackendStart).toHaveBeenCalledTimes(1);
    expect(mockShowStarting).toHaveBeenCalledWith(
      'Movie',
      'movie_direct_0',
      'http',
      '#ffffff',
    );
    expect(mockShowComplete).toHaveBeenCalledWith(
      'Movie',
      'movie_direct_0',
      'http',
      '#ffffff',
    );
    expect(useDownloadsStore.getState().downloads.movie_direct_0.status).toBe(
      'completed',
    );
  });

  it('retries a transient HTTP connection abort before failing', async () => {
    enqueueDownload();
    mockBackendStart
      .mockRejectedValueOnce(
        new Error(
          "Call to function 'FileSystemDownloadTask.start' has been rejected -> Caused by: Unable to download a file: Software caused connection abort",
        ),
      )
      .mockResolvedValueOnce(undefined);

    await startDownload('movie_direct_0', location);

    expect(mockBackendStart).toHaveBeenCalledTimes(2);
    expect(useDownloadsStore.getState().downloads.movie_direct_0.status).toBe(
      'completed',
    );
    expect(mockShowFailed).not.toHaveBeenCalled();
  });

  it('keeps a queue-released download alive through temporary DNS failures', async () => {
    jest.useFakeTimers();
    try {
      mockDownloadConcurrency = 1;
      enqueueDownload();
      mockBackendStart
        .mockRejectedValueOnce(
          new Error(
            'Unable to resolve host "example.r2.cloudflarestorage.com": No address associated with hostname',
          ),
        )
        .mockRejectedValueOnce(new Error('Unknown host'))
        .mockRejectedValueOnce(new Error('Unknown host'))
        .mockRejectedValueOnce(new Error('Unknown host'))
        .mockResolvedValueOnce(undefined);
      useDownloadsStore.getState().updateDownload('movie_direct_0', {
        downloadLocation: location,
        downloadedBytes: 1_600_000,
        totalBytes: 1_200_000_000,
        status: 'queued',
      });

      await scheduleQueuedDownloads();
      await jest.runAllTimersAsync();

      expect(mockBackendStart).toHaveBeenCalledTimes(5);
      expect(useDownloadsStore.getState().downloads.movie_direct_0.status).toBe(
        'completed',
      );
      expect(
        useDownloadsStore.getState().downloads.movie_direct_0.downloadedBytes,
      ).toBe(100);
      expect(mockShowFailed).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('removes the queued notification before showing download progress', async () => {
    enqueueDownload();

    await startDownload('movie_direct_0', location);

    expect(mockCancelNotification).toHaveBeenCalledWith('movie_direct_0');
    expect(mockCancelNotification.mock.invocationCallOrder[0]).toBeLessThan(
      mockShowStarting.mock.invocationCallOrder[0],
    );
  });

  it('claims a Start now download before notification work can requeue it', async () => {
    let releaseNotification: (() => void) | undefined;
    mockCancelNotification.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          releaseNotification = resolve;
        }),
    );
    useDownloadsStore.getState().enqueueDownload({
      id: 'priority',
      title: 'priority',
      type: 'movie',
      url: 'https://example.com/priority.mp4',
      sourceType: 'http',
      videoType: 'mp4',
      downloadLocation: location,
    });

    const start = startQueuedDownloadNow('priority');
    expect(useDownloadsStore.getState().downloads.priority.status).toBe(
      'starting',
    );

    await scheduleQueuedDownloads();
    expect(mockShowQueued).not.toHaveBeenCalledWith(
      'priority',
      'priority',
      'http',
    );

    releaseNotification?.();
    await start;
  });

  it('releases tracking when notification startup fails', async () => {
    enqueueDownload();
    mockShowStarting.mockRejectedValueOnce(new Error('notification failed'));

    await expect(startDownload('movie_direct_0', location)).rejects.toThrow(
      'notification failed',
    );

    expect(mockShowFailed).toHaveBeenCalledWith(
      'Movie',
      'movie_direct_0',
      'http',
      '#ffffff',
    );
    expect(mockStopForegroundTask).toHaveBeenCalledWith('movie_direct_0');
  });

  it('pauses and resumes an active supported download', async () => {
    let resolveStart: (() => void) | undefined;
    mockBackendStart.mockImplementationOnce(
      () =>
        new Promise<void>(resolve => {
          resolveStart = resolve;
        }),
    );
    enqueueDownload();
    const start = startDownload('movie_direct_0', location);
    await flushAsyncWork();
    useDownloadsStore.getState().updateDownload('movie_direct_0', {
      status: 'downloading',
      canPause: true,
    });

    await pauseDownload('movie_direct_0');

    expect(mockBackendPause).toHaveBeenCalledWith('movie_direct_0');
    expect(useDownloadsStore.getState().downloads.movie_direct_0).toMatchObject(
      {
        status: 'paused',
        canPause: false,
        canResume: true,
      },
    );

    await resumeDownload('movie_direct_0');

    expect(mockBackendResume).toHaveBeenCalledWith('movie_direct_0');
    expect(useDownloadsStore.getState().downloads.movie_direct_0).toMatchObject(
      {
        status: 'downloading',
        canPause: true,
        canResume: false,
      },
    );

    resolveStart?.();
    await start;
  });

  it('deletes partial data and shows a non-retryable error when pause fails', async () => {
    enqueueDownload();
    useDownloadsStore.getState().updateDownload('movie_direct_0', {
      status: 'downloading',
      canPause: true,
      stagingPath: '/cache/downloads/movie/Movie.mp4.part',
    });
    mockBackendPause.mockRejectedValueOnce(
      new Error('Server did not provide resume data'),
    );

    await pauseDownload('movie_direct_0');

    expect(mockBackendCancel).toHaveBeenCalledWith('movie_direct_0');
    expect(mockBackendCleanup).toHaveBeenCalledWith(
      'movie_direct_0',
      expect.objectContaining({id: 'movie_direct_0'}),
    );
    expect(useDownloadsStore.getState().downloads.movie_direct_0).toMatchObject(
      {
        status: 'error',
        errorCode: 'PAUSE_UNSUPPORTED',
        retryable: false,
        canPause: false,
        canResume: false,
      },
    );
    expect(
      useDownloadsStore.getState().downloads.movie_direct_0.errorMessage,
    ).toContain('Partial download data was deleted');
    expect(mockShowFailed).toHaveBeenCalledWith(
      'Movie',
      'movie_direct_0',
      'http',
      '#ffffff',
    );
  });

  it('restarts a paused download that has no live job after an app restart', async () => {
    enqueueDownload();
    useDownloadsStore.getState().updateDownload('movie_direct_0', {
      status: 'paused',
      canPause: false,
      canResume: true,
      downloadLocation: location,
    });
    mockBackendResume.mockRejectedValueOnce(
      new Error('Paused torrent cannot be resumed'),
    );

    await resumeDownload('movie_direct_0');
    await flushAsyncWork();

    expect(mockBackendResume).not.toHaveBeenCalled();
    expect(mockBackendStart).toHaveBeenCalledTimes(1);
    expect(mockShowFailed).not.toHaveBeenCalled();
    expect(useDownloadsStore.getState().downloads.movie_direct_0.status).toBe(
      'completed',
    );
  });

  it('does not leave a stale pause failure that hides later start errors', async () => {
    enqueueDownload();
    useDownloadsStore.getState().updateDownload('movie_direct_0', {
      status: 'downloading',
      canPause: true,
    });
    mockBackendPause.mockRejectedValueOnce(new Error('No active torrent'));
    await pauseDownload('movie_direct_0');
    mockBackendStart.mockRejectedValueOnce(new Error('Tracker unreachable'));

    await expect(startDownload('movie_direct_0', location)).rejects.toThrow(
      'Tracker unreachable',
    );

    expect(useDownloadsStore.getState().downloads.movie_direct_0).toMatchObject(
      {
        status: 'error',
        retryable: true,
      },
    );
  });

  it('starts two queued downloads and waits for a slot before starting the third', async () => {
    const resolvers = new Map<string, () => void>();
    mockBackendStart.mockImplementation(
      ({record}) =>
        new Promise<void>(resolve => {
          resolvers.set(record.id, resolve);
        }),
    );
    for (const id of ['first', 'second', 'third']) {
      useDownloadsStore.getState().enqueueDownload({
        id,
        title: id,
        type: 'movie',
        url: `https://example.com/${id}.mp4`,
        sourceType: 'http',
        videoType: 'mp4',
        downloadLocation: location,
        createdAt: id === 'first' ? 1 : id === 'second' ? 2 : 3,
      });
    }

    await scheduleQueuedDownloads();
    await flushAsyncWork();

    expect(mockBackendStart).toHaveBeenCalledTimes(2);
    expect(
      mockBackendStart.mock.calls.map(([context]) => context.record.id),
    ).toEqual(['first', 'second']);

    resolvers.get('first')!();
    await flushAsyncWork();
    await flushAsyncWork();

    expect(mockBackendStart).toHaveBeenCalledTimes(3);
    expect(mockBackendStart.mock.calls[2][0].record.id).toBe('third');

    resolvers.get('second')!();
    resolvers.get('third')!();
  });

  it('hands a freed queue slot to the next download before stopping foreground service', async () => {
    mockDownloadConcurrency = 1;
    let resolveFirst: (() => void) | undefined;
    let resolveSecond: (() => void) | undefined;
    mockBackendStart.mockImplementation(
      ({record}) =>
        new Promise<void>(resolve => {
          if (record.id === 'first') {
            resolveFirst = resolve;
          } else {
            resolveSecond = resolve;
          }
        }),
    );
    for (const [index, id] of ['first', 'second'].entries()) {
      useDownloadsStore.getState().enqueueDownload({
        id,
        title: id,
        type: 'movie',
        url: `https://example.com/${id}.mp4`,
        sourceType: 'http',
        videoType: 'mp4',
        downloadLocation: location,
        createdAt: index + 1,
      });
    }

    await scheduleQueuedDownloads();
    await flushAsyncWork();
    resolveFirst?.();
    await flushAsyncWork();
    await flushAsyncWork();

    const secondForegroundCall = mockStartForegroundTask.mock.calls.findIndex(
      ([downloadId]) => downloadId === 'second',
    );
    const firstStopCall = mockStopForegroundTask.mock.calls.findIndex(
      ([downloadId]) => downloadId === 'first',
    );
    expect(secondForegroundCall).toBeGreaterThanOrEqual(0);
    expect(firstStopCall).toBeGreaterThanOrEqual(0);
    expect(
      mockStartForegroundTask.mock.invocationCallOrder[secondForegroundCall],
    ).toBeLessThan(
      mockStopForegroundTask.mock.invocationCallOrder[firstStopCall],
    );

    resolveSecond?.();
  });

  it('starts the next queued download when the active download is paused', async () => {
    mockDownloadConcurrency = 1;
    const resolvers = new Map<string, () => void>();
    mockBackendStart.mockImplementation(
      ({record}) =>
        new Promise<void>(resolve => {
          resolvers.set(record.id, resolve);
        }),
    );
    for (const [index, id] of ['first', 'second'].entries()) {
      useDownloadsStore.getState().enqueueDownload({
        id,
        title: id,
        type: 'movie',
        url: `https://example.com/${id}.mp4`,
        sourceType: 'http',
        videoType: 'mp4',
        downloadLocation: location,
        createdAt: index + 1,
      });
    }

    await scheduleQueuedDownloads();
    await flushAsyncWork();
    useDownloadsStore.getState().updateDownload('first', {
      status: 'downloading',
      canPause: true,
    });

    await pauseDownload('first');
    await flushAsyncWork();

    expect(mockBackendPause).toHaveBeenCalledWith('first');
    expect(useDownloadsStore.getState().downloads.first.status).toBe('paused');
    expect(mockBackendStart).toHaveBeenCalledTimes(2);
    expect(mockBackendStart.mock.calls[1][0].record.id).toBe('second');

    resolvers.forEach(resolve => resolve());
  });

  it('waits for a free slot before resuming a paused download', async () => {
    mockDownloadConcurrency = 1;
    mockBackendResume.mockReset().mockResolvedValue(undefined);
    const resolvers = new Map<string, () => void>();
    mockBackendStart.mockImplementation(
      ({record}) =>
        new Promise<void>(resolve => {
          resolvers.set(record.id, resolve);
        }),
    );
    for (const [index, id] of ['paused', 'running'].entries()) {
      useDownloadsStore.getState().enqueueDownload({
        id,
        title: id,
        type: 'movie',
        url: `https://example.com/${id}.mp4`,
        sourceType: 'http',
        videoType: 'mp4',
        downloadLocation: location,
        createdAt: index + 1,
      });
    }

    await scheduleQueuedDownloads();
    await flushAsyncWork();
    useDownloadsStore.getState().updateDownload('paused', {
      status: 'downloading',
      canPause: true,
    });
    await pauseDownload('paused');
    await flushAsyncWork();
    expect(mockBackendStart.mock.calls[1][0].record.id).toBe('running');

    await resumeDownload('paused');
    await flushAsyncWork();

    expect(mockBackendResume).not.toHaveBeenCalled();
    expect(useDownloadsStore.getState().downloads.paused.status).toBe('queued');

    resolvers.get('running')?.();
    await flushAsyncWork();
    await flushAsyncWork();

    expect(mockBackendResume).toHaveBeenCalledWith('paused');
    expect(mockBackendStart).toHaveBeenCalledTimes(2);
    expect(useDownloadsStore.getState().downloads.paused).toMatchObject({
      status: 'downloading',
      canPause: true,
      canResume: false,
    });

    resolvers.get('paused')?.();
    await flushAsyncWork();
    expect(useDownloadsStore.getState().downloads.paused.status).toBe(
      'completed',
    );
  });

  it('starts a queued download immediately even when normal slots are full', async () => {
    const resolvers = new Map<string, () => void>();
    mockBackendStart.mockImplementation(
      ({record}) =>
        new Promise<void>(resolve => {
          resolvers.set(record.id, resolve);
        }),
    );
    for (const [index, id] of ['first', 'second', 'priority'].entries()) {
      useDownloadsStore.getState().enqueueDownload({
        id,
        title: id,
        type: 'movie',
        url: `https://example.com/${id}.mp4`,
        sourceType: 'http',
        videoType: 'mp4',
        downloadLocation: location,
        createdAt: index + 1,
      });
    }

    await scheduleQueuedDownloads();
    await flushAsyncWork();
    expect(mockBackendStart).toHaveBeenCalledTimes(2);

    const priorityStart = startQueuedDownloadNow('priority');
    await flushAsyncWork();

    expect(mockBackendStart).toHaveBeenCalledTimes(3);
    expect(mockBackendStart.mock.calls[2][0].record.id).toBe('priority');

    resolvers.forEach(resolve => resolve());
    await priorityStart;
  });

  it('removes an active download immediately when canceled', async () => {
    let resolveStart: (() => void) | undefined;
    mockBackendStart.mockImplementation(
      () =>
        new Promise<void>(resolve => {
          resolveStart = resolve;
        }),
    );
    useDownloadsStore.getState().enqueueDownload({
      id: 'active',
      title: 'active',
      type: 'movie',
      url: 'https://example.com/active.mp4',
      sourceType: 'http',
      videoType: 'mp4',
      downloadLocation: location,
    });

    const start = startDownload('active', location);
    await flushAsyncWork();
    await cancelDownload('active');

    expect(mockBackendCancel).toHaveBeenCalledWith('active');
    expect(useDownloadsStore.getState().downloads.active).toBeUndefined();

    resolveStart?.();
    await start;
  });

  it('keeps a completed download when a stale cancel arrives', async () => {
    enqueueDownload();
    await startDownload('movie_direct_0', location);
    mockBackendCleanup.mockClear();

    await cancelDownload('movie_direct_0');

    expect(mockBackendCancel).not.toHaveBeenCalled();
    expect(mockBackendCleanup).not.toHaveBeenCalled();
    expect(useDownloadsStore.getState().downloads.movie_direct_0?.status).toBe(
      'completed',
    );
  });
  const enqueueThree = () => {
    for (const [index, id] of ['first', 'second', 'third'].entries()) {
      useDownloadsStore.getState().enqueueDownload({
        id,
        title: id,
        type: 'movie',
        url: `https://example.com/${id}.mp4`,
        sourceType: 'http',
        videoType: 'mp4',
        downloadLocation: location,
        createdAt: index + 1,
      });
    }
  };
  const settle = async () => {
    for (let i = 0; i < 10; i++) {
      await flushAsyncWork();
    }
  };

  it('keeps the rest of the queue waiting when storage is full', async () => {
    mockDownloadConcurrency = 1;
    mockBackendStart.mockRejectedValue(
      new Error(
        'Unable to write to the SAF destination: write failed: ENOSPC (No space left on device)',
      ),
    );
    enqueueThree();

    await scheduleQueuedDownloads();
    await settle();

    expect(mockBackendStart).toHaveBeenCalledTimes(1);
    const {downloads} = useDownloadsStore.getState();
    expect(downloads.first).toMatchObject({
      status: 'error',
      errorCode: 'STORAGE_FULL',
      retryable: true,
    });
    expect(downloads.first.errorMessage).toMatch(/storage/i);
    expect(downloads.second.status).toBe('queued');
    expect(downloads.third.status).toBe('queued');

    mockBackendStart.mockResolvedValue(undefined);
    await retryDownload('first');
    await settle();

    expect(mockBackendStart).toHaveBeenCalledTimes(4);
    expect(useDownloadsStore.getState().downloads.third.status).toBe(
      'completed',
    );
  });

  it.each(['complete', 'cancel'] as const)(
    'keeps the queue held when a concurrent download ends by %s',
    async ending => {
      mockDownloadConcurrency = 2;
      let finishSecond!: () => void;
      mockBackendStart.mockImplementation(async ({record}: any) => {
        if (record.id === 'second') {
          await new Promise<void>(resolve => { finishSecond = resolve; });
          return;
        }
        throw new Error('ENOSPC: no space left on device');
      });
      enqueueThree();
      await scheduleQueuedDownloads();
      await settle();
      expect(useDownloadsStore.getState().storageFullHold).toBe(true);
      if (ending === 'cancel') await cancelDownload('second');
      finishSecond();
      await settle();
      expect(useDownloadsStore.getState().downloads.third.status).toBe('queued');
      expect(mockBackendStart).toHaveBeenCalledTimes(2);
    },
  );

  it('sets the hold before asynchronous cleanup can release another slot', async () => {
    mockDownloadConcurrency = 2;
    let finishSecond!: () => void;
    let finishCleanup!: () => void;
    mockBackendStart.mockImplementation(async ({record}: any) => {
      if (record.id === 'second') {
        await new Promise<void>(resolve => { finishSecond = resolve; });
        return;
      }
      throw new Error('ENOSPC: no space left on device');
    });
    mockBackendCleanup.mockImplementationOnce(async () => {
      await new Promise<void>(resolve => { finishCleanup = resolve; });
    });
    enqueueThree();
    await scheduleQueuedDownloads();
    await settle();
    expect(useDownloadsStore.getState().storageFullHold).toBe(true);
    finishSecond();
    await settle();
    expect(mockBackendStart).toHaveBeenCalledTimes(2);
    finishCleanup();
    await settle();
    expect(useDownloadsStore.getState().downloads.third.status).toBe('queued');
  });

  it('does not clear a storage hold when work is added or concurrency changes', async () => {
    mockDownloadConcurrency = 1;
    mockBackendStart.mockRejectedValue(new Error('ENOSPC'));
    enqueueThree();
    await scheduleQueuedDownloads();
    await settle();
    useDownloadsStore.getState().enqueueDownload({
      id: 'fourth', title: 'Fourth', type: 'movie',
      url: 'https://example.com/fourth.mp4', downloadLocation: location,
    });
    updateDownloadConcurrency(3);
    await scheduleQueuedDownloads();
    await settle();
    expect(mockBackendStart).toHaveBeenCalledTimes(1);
    expect(useDownloadsStore.getState().storageFullHold).toBe(true);
  });

  it.each(['start now', 'resume'] as const)(
    'releases the storage hold on explicit %s',
    async action => {
      mockDownloadConcurrency = 1;
      mockBackendStart.mockRejectedValue(new Error('ENOSPC'));
      enqueueThree();
      await scheduleQueuedDownloads();
      await settle();
      mockBackendStart.mockResolvedValue(undefined);
      if (action === 'resume') {
        useDownloadsStore.getState().updateDownload('second', {
          status: 'paused', canResume: true,
        });
        await resumeDownload('second');
      } else {
        await startQueuedDownloadNow('second');
      }
      await settle();
      expect(useDownloadsStore.getState().storageFullHold).toBe(false);
      expect(useDownloadsStore.getState().downloads.third.status).toBe('completed');
    },
  );

  it('moves on to the next queued download after other errors', async () => {
    mockDownloadConcurrency = 1;
    mockBackendStart.mockRejectedValue(new Error('HTTP 404'));
    enqueueThree();

    await scheduleQueuedDownloads();
    await settle();

    expect(mockBackendStart).toHaveBeenCalledTimes(3);
    expect(useDownloadsStore.getState().downloads.first.errorCode).toBe(
      undefined,
    );
  });
});

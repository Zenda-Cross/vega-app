const mockBackendStart = jest.fn(async () => undefined);
const mockBackendCancel = jest.fn(async () => undefined);
const mockBackendCleanup = jest.fn(async () => undefined);
const mockPrepareDestination = jest.fn(async () => ({
  stagingDirectory: '',
  stagingPath: 'content://downloads/tree/Movie.mp4',
  directFinalDocumentUri: 'content://downloads/tree/Movie.mp4',
}));

jest.mock('../src/lib/downloadBackends/registry', () => ({
  getDownloadBackend: () => ({
    directToSaf: true,
    preservePartialOnFailure: true,
    start: mockBackendStart,
    cancel: mockBackendCancel,
    cleanup: mockBackendCleanup,
  }),
}));

jest.mock('../src/lib/downloadDestination', () => ({
  prepareDownloadDestination: (...args: unknown[]) =>
    (mockPrepareDestination as jest.Mock)(...args),
  finalizeDownloadOutput: async () => ({
    filePath: 'content://downloads/tree/Movie.mp4',
    finalDocumentUri: 'content://downloads/tree/Movie.mp4',
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
    startForegroundTask: jest.fn(async () => undefined),
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
    isAutoDownloadServerFallbackEnabled: () => true,
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

import {cancelDownload, startDownload} from '../src/lib/downloadManager';
import {notificationService} from '../src/lib/services/Notification';
import useDownloadsStore from '../src/lib/zustand/downloadsStore';

const mockShowStarting = notificationService.showDownloadStarting as jest.Mock;

const location = {
  type: 'saf' as const,
  uri: 'content://downloads/tree',
  label: 'Downloads',
};

const enqueue = (createdAt: number) =>
  useDownloadsStore.getState().enqueueDownload({
    id: 'movie',
    title: 'Movie',
    type: 'movie',
    url: 'https://example.com/movie.mp4',
    sourceType: 'http',
    videoType: 'mp4',
    downloadLocation: location,
    createdAt,
  });

const deferred = () => {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>(done => {
    resolve = done;
  });
  return {promise, resolve};
};

describe('cancel while a download is starting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDownloadsStore.setState({downloads: {}});
  });

  it('does not start the backend when canceled before the destination is ready', async () => {
    const gate = deferred();
    mockShowStarting.mockImplementationOnce(() => gate.promise);
    enqueue(1);

    const start = startDownload('movie', location);
    await cancelDownload('movie');
    gate.resolve();
    await start;

    expect(mockPrepareDestination).not.toHaveBeenCalled();
    expect(mockBackendStart).not.toHaveBeenCalled();
    expect(useDownloadsStore.getState().downloads.movie).toBeUndefined();
  });

  it('deletes the created destination file when canceled while it was being prepared', async () => {
    const gate = deferred();
    mockPrepareDestination.mockImplementationOnce(async () => {
      await gate.promise;
      return {
        stagingDirectory: '',
        stagingPath: 'content://downloads/tree/Movie.mp4',
        directFinalDocumentUri: 'content://downloads/tree/Movie.mp4',
      };
    });
    enqueue(1);

    const start = startDownload('movie', location);
    await new Promise<void>(resolve => setImmediate(resolve));
    await cancelDownload('movie');
    gate.resolve();
    await start;

    expect(mockBackendStart).not.toHaveBeenCalled();
    expect(mockBackendCleanup).toHaveBeenLastCalledWith(
      'movie',
      expect.objectContaining({
        finalDocumentUri: 'content://downloads/tree/Movie.mp4',
      }),
    );
  });

  it('keeps a new download queued after the canceled run stops', async () => {
    const gate = deferred();
    mockShowStarting.mockImplementationOnce(() => gate.promise);
    enqueue(1);

    const start = startDownload('movie', location);
    await cancelDownload('movie');
    enqueue(2);
    await startDownload('movie', location);
    gate.resolve();
    await start;

    expect(useDownloadsStore.getState().downloads.movie).toMatchObject({
      createdAt: 2,
    });
  });
});

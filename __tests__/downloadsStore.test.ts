import {beforeEach, describe, expect, it, jest} from '@jest/globals';

const mockStorageValues = new Map<string, string>();

jest.mock('react-native-mmkv-storage', () => ({
  MMKVLoader: class {
    withInstanceID() {
      return this;
    }

    initialize() {
      return {
        getString: (key: string) => mockStorageValues.get(key),
        setString: (key: string, value: string) =>
          mockStorageValues.set(key, value),
        getBool: () => undefined,
        setBool: () => undefined,
        getInt: () => undefined,
        setInt: () => undefined,
        removeItem: (key: string) => mockStorageValues.delete(key),
        clearStore: () => mockStorageValues.clear(),
      };
    }
  },
}));

import {
  createDirectDownloadId,
  createSeriesDownloadId,
} from '../src/lib/downloadId';
import useDownloadsStore, {
  migrateLegacyDownloads,
  selectCompletedDownloads,
  selectCurrentDownloads,
} from '../src/lib/zustand/downloadsStore';

describe('downloads store', () => {
  beforeEach(() => {
    mockStorageValues.clear();
    useDownloadsStore.setState({downloads: {}, storageFullHold: false});
  });

  it('uses the same download IDs as desktop', () => {
    expect(createSeriesDownloadId('Vega Show', 'Season 2', 2)).toBe(
      'Vega Show_SSeason 2_E3',
    );
    expect(createDirectDownloadId('Vega Movie', 0)).toBe('Vega Movie_direct_0');
  });

  it('stores downloads by their desktop-compatible ID', () => {
    const id = createSeriesDownloadId('Vega Show', 'Season 1', 0);
    useDownloadsStore.getState().enqueueDownload({
      id,
      title: 'Vega Show Season 1 Episode 1',
      showName: 'Vega Show',
      seasonTitle: 'Season 1',
      episodeName: 'Episode 1',
      background: 'https://example.com/background.jpg',
      synopsis: 'Stored offline synopsis',
      subtitles: [
        {url: 'https://example.com/en.vtt', language: 'en', format: 'vtt'},
      ],
      type: 'series',
      url: 'https://example.com/video.mp4',
    });

    expect(useDownloadsStore.getState().downloads[id]).toMatchObject({
      id,
      background: 'https://example.com/background.jpg',
      synopsis: 'Stored offline synopsis',
      subtitles: [
        {url: 'https://example.com/en.vtt', language: 'en', format: 'vtt'},
      ],
    });
    expect(selectCurrentDownloads(useDownloadsStore.getState())).toHaveLength(
      1,
    );
  });

  it('updates progress and completion state', () => {
    const id = createDirectDownloadId('Vega Movie', 0);
    const store = useDownloadsStore.getState();
    store.enqueueDownload({
      id,
      title: 'Vega Movie',
      type: 'movie',
      url: 'https://example.com/video.mp4',
    });
    store.updateProgress(id, 50, 100, 10);
    store.markCompleted(id, {
      filePath: 'content://downloads/vega-movie',
      finalDocumentUri: 'content://downloads/vega-movie',
      totalBytes: 100,
    });

    const completed = selectCompletedDownloads(useDownloadsStore.getState());
    expect(completed).toHaveLength(1);
    expect(completed[0]).toMatchObject({
      id,
      status: 'completed',
      downloadedBytes: 100,
      speed: 0,
    });
  });

  it('does not let late progress events overwrite a network pause', () => {
    const id = createDirectDownloadId('Vega Movie', 0);
    const store = useDownloadsStore.getState();
    store.enqueueDownload({
      id,
      title: 'Vega Movie',
      type: 'movie',
      url: 'https://example.com/video.mp4',
    });
    store.updateDownload(id, {
      status: 'paused',
      speed: 0,
      canPause: false,
      canResume: true,
      errorCode: 'NETWORK_INTERRUPTED',
      errorMessage: 'Waiting for network connection',
    });

    store.updateProgress(id, 50, 100, 10);

    expect(useDownloadsStore.getState().downloads[id]).toMatchObject({
      status: 'paused',
      downloadedBytes: 50,
      totalBytes: 100,
      speed: 0,
      canResume: true,
      errorCode: 'NETWORK_INTERRUPTED',
      errorMessage: 'Waiting for network connection',
    });
  });

  it('keeps active downloads in creation order as progress updates arrive', () => {
    const store = useDownloadsStore.getState();
    store.enqueueDownload({
      id: 'first',
      title: 'First',
      type: 'movie',
      url: 'https://example.com/first.mp4',
      createdAt: 10,
    });
    store.enqueueDownload({
      id: 'second',
      title: 'Second',
      type: 'movie',
      url: 'https://example.com/second.mp4',
      createdAt: 20,
    });

    store.updateProgress('second', 20, 100, 10);
    store.updateProgress('first', 10, 100, 10);

    expect(
      selectCurrentDownloads(useDownloadsStore.getState()).map(item => item.id),
    ).toEqual(['first', 'second']);

    store.updateProgress('first', 30, 100, 10);
    store.updateProgress('second', 40, 100, 10);

    expect(
      selectCurrentDownloads(useDownloadsStore.getState()).map(item => item.id),
    ).toEqual(['first', 'second']);
  });

  it.each(['paused', 'pausing'] as const)('preserves %s HLS work as resumable after a restart', status => {
    useDownloadsStore.getState().enqueueDownload({id: 'hls-resume', title: 'Movie', type: 'movie',
      sourceType: 'hls', url: 'https://example.com/movie.m3u8', status, downloadedBytes: 4, totalBytes: 10});
    useDownloadsStore.getState().reconcileDownloads();
    expect(useDownloadsStore.getState().downloads['hls-resume']).toMatchObject({
      status: 'paused', canResume: true, canPause: false, downloadedBytes: 4, totalBytes: 10,
    });
  });

  it('marks active persisted work as interrupted during reconciliation', () => {
    const id = createDirectDownloadId('Vega Movie', 0);
    useDownloadsStore.getState().enqueueDownload({
      id,
      title: 'Vega Movie',
      type: 'movie',
      url: 'https://example.com/video.mp4',
      status: 'downloading',
    });

    useDownloadsStore.getState().reconcileDownloads();

    expect(useDownloadsStore.getState().downloads[id]).toMatchObject({
      status: 'interrupted',
      retryable: true,
      speed: 0,
    });
  });

  it('migrates the previous persisted payload format', () => {
    const migrated = migrateLegacyDownloads(
      new Map([
        [
          'Legacy_direct_0',
          {
            fileName: 'Legacy',
            provider: 'test-provider',
            folderName: '',
            fileType: 'mp4',
            status: 'downloaded' as const,
          },
        ],
      ]),
      100,
    );

    expect(migrated.Legacy_direct_0).toMatchObject({
      id: 'Legacy_direct_0',
      status: 'completed',
      legacy: true,
      completedAt: 100,
    });
  });
  it('persists storage holds immediately and restores them on hydration', async () => {
    const key = useDownloadsStore.persist.getOptions().name;
    useDownloadsStore.setState({storageFullHold: true});
    const saved = mockStorageValues.get(key)!;
    expect(JSON.parse(saved).state.storageFullHold).toBe(true);
    useDownloadsStore.setState({storageFullHold: false});
    expect(JSON.parse(mockStorageValues.get(key)!).state.storageFullHold).toBe(false);
    mockStorageValues.set(key, saved);
    await useDownloadsStore.persist.rehydrate();
    expect(useDownloadsStore.getState().storageFullHold).toBe(true);
  });

  it('defaults older persisted downloads without a hold flag to unblocked', async () => {
    const key = useDownloadsStore.persist.getOptions().name;
    useDownloadsStore.setState({storageFullHold: true});
    mockStorageValues.set(key, JSON.stringify({state: {downloads: {}}, version: 1}));
    await useDownloadsStore.persist.rehydrate();
    expect(useDownloadsStore.getState().storageFullHold).toBe(false);
  });

});

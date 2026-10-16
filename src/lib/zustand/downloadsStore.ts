import {AppState} from 'react-native';
import {create} from 'zustand';
import {
  createJSONStorage,
  persist,
  type PersistStorage,
  type StorageValue,
} from 'zustand/middleware';
import type {DownloadLocationConfig} from '../downloadLocation';
import {createZustandStorage} from '../storage/StorageService';
import {
  downloadsStorage,
  type DownloadPayload,
} from '../storage/DownloadsStorage';
import type {SkipInterval} from '../providers/types';

export const DOWNLOADS_STORAGE_KEY = 'vega-downloads-storage';
export const DOWNLOADS_SCHEMA_VERSION = 1;

export type DownloadStatus =
  | 'queued'
  | 'starting'
  | 'downloading'
  | 'pausing'
  | 'paused'
  | 'finalizing'
  | 'completed'
  | 'interrupted'
  | 'error'
  | 'missing'
  | 'canceling';

export type DownloadSourceType = 'http' | 'hls' | 'torrent';

export interface DownloadSubtitle {
  url: string;
  language: string;
  format?: string;
}

export interface DownloadItem {
  schemaVersion: number;
  id: string;
  title: string;
  showName?: string;
  episodeName?: string;
  seasonTitle?: string;
  episodeIndex?: number;
  type: 'movie' | 'series';
  imdbId?: string;
  url: string;
  poster?: string;
  background?: string;
  synopsis?: string;
  provider?: string;
  infoUrl?: string;
  sourceLink?: string;
  headers?: Record<string, string>;
  subtitles?: DownloadSubtitle[];
  server?: string;
  quality?: string;
  isSubtitle?: boolean;
  videoType?: string | null;
  sourceType: DownloadSourceType;
  isTorrent: boolean;
  torrentInfoHash?: string;
  filePath: string;
  downloadLocation?: DownloadLocationConfig;
  stagingPath?: string;
  finalDocumentUri?: string;
  displayFileName?: string;
  mimeType?: string;
  totalBytes: number;
  downloadedBytes: number;
  speed: number;
  status: DownloadStatus;
  errorCode?: string;
  errorMessage?: string;
  retryable?: boolean;
  canPause: boolean;
  canResume: boolean;
  backendJobId?: string | number;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  legacy?: boolean;
  skip?: SkipInterval[];
}

export type DownloadMediaInput = Pick<
  DownloadItem,
  | 'id'
  | 'title'
  | 'showName'
  | 'episodeName'
  | 'seasonTitle'
  | 'episodeIndex'
  | 'type'
  | 'imdbId'
  | 'poster'
  | 'background'
  | 'synopsis'
  | 'provider'
  | 'server'
  | 'quality'
  | 'isSubtitle'
  | 'infoUrl'
  | 'sourceLink'
  | 'subtitles'
  | 'displayFileName'
  | 'skip'
>;

export type DownloadInput = Pick<
  DownloadItem,
  'id' | 'title' | 'type' | 'url'
> &
  Partial<Omit<DownloadItem, 'id' | 'title' | 'type' | 'url'>>;

export interface DownloadErrorDetails {
  code?: string;
  message?: string;
  retryable?: boolean;
}

interface DownloadState {
  /** Stops automatic starts after ENOSPC until an explicit retry/resume. */
  storageFullHold: boolean;
  downloads: Record<string, DownloadItem>;
  enqueueDownload: (item: DownloadInput) => void;
  addDownload: (item: DownloadInput) => void;
  updateDownload: (id: string, update: Partial<DownloadItem>) => void;
  updateProgress: (
    id: string,
    downloaded: number,
    total: number,
    speed: number,
  ) => void;
  markStarting: (id: string) => void;
  markPaused: (id: string) => void;
  markInterrupted: (id: string, message?: string) => void;
  markFinalizing: (id: string) => void;
  markCompleted: (
    id: string,
    output?: Pick<DownloadItem, 'filePath'> &
      Partial<Pick<DownloadItem, 'finalDocumentUri' | 'totalBytes'>>,
  ) => void;
  markError: (id: string, error?: DownloadErrorDetails) => void;
  markMissing: (id: string, message?: string) => void;
  markCanceling: (id: string) => void;
  pauseDownload: (id: string) => void;
  resumeDownload: (id: string) => void;
  cancelDownload: (id: string) => void;
  removeDownload: (id: string) => void;
  getDownload: (id: string) => DownloadItem | undefined;
  getDownloadByMediaId: (id: string) => DownloadItem | undefined;
  reconcileDownloads: () => void;
}

export const CURRENT_DOWNLOAD_STATUSES: ReadonlySet<DownloadStatus> = new Set([
  'queued',
  'starting',
  'downloading',
  'pausing',
  'paused',
  'finalizing',
  'interrupted',
  'error',
  'canceling',
]);

const INTERRUPTIBLE_STATUSES: ReadonlySet<DownloadStatus> = new Set([
  'starting',
  'downloading',
  'pausing',
  'paused',
  'finalizing',
  'canceling',
]);

const getSourceType = (
  item: Pick<DownloadInput, 'url' | 'videoType' | 'isTorrent' | 'sourceType'>,
): DownloadSourceType => {
  if (item.sourceType) {
    return item.sourceType;
  }
  if (item.isTorrent || item.url.startsWith('magnet:')) {
    return 'torrent';
  }
  if (item.videoType === 'm3u8' || item.url.includes('.m3u8')) {
    return 'hls';
  }
  return 'http';
};

const normalizeDownload = (
  input: DownloadInput,
  now = Date.now(),
): DownloadItem => {
  const sourceType = getSourceType(input);
  return {
    ...input,
    schemaVersion: DOWNLOADS_SCHEMA_VERSION,
    sourceType,
    isTorrent: sourceType === 'torrent',
    filePath: input.filePath || '',
    totalBytes: input.totalBytes || 0,
    downloadedBytes: input.downloadedBytes || 0,
    speed: input.speed || 0,
    status: input.status || 'queued',
    canPause: input.canPause ?? false,
    canResume: input.canResume ?? false,
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
  };
};

export const migrateLegacyDownloads = (
  legacyDownloads: Map<string, DownloadPayload>,
  now = Date.now(),
): Record<string, DownloadItem> => {
  const downloads: Record<string, DownloadItem> = {};

  legacyDownloads.forEach((legacy, id) => {
    const sourceType = getSourceType({
      url: legacy.url || '',
      videoType: legacy.fileType,
      isTorrent:
        legacy.fileType === 'torrent' || legacy.url?.startsWith('magnet:'),
    });

    downloads[id] = normalizeDownload(
      {
        id,
        title: legacy.fileName,
        showName: legacy.folderName || undefined,
        type: legacy.folderName ? 'series' : 'movie',
        url: legacy.url || '',
        provider: legacy.provider,
        videoType: legacy.fileType,
        sourceType,
        displayFileName: `${legacy.fileName}.${legacy.fileType}`,
        status: legacy.status === 'downloaded' ? 'completed' : legacy.status,
        downloadedBytes: legacy.progress || 0,
        legacy: true,
        createdAt: now,
        updatedAt: now,
        completedAt: legacy.status === 'downloaded' ? now : undefined,
      },
      now,
    );
  });

  return downloads;
};

const normalizePersistedDownloads = (
  downloads: unknown,
): Record<string, DownloadItem> => {
  if (!downloads || typeof downloads !== 'object' || Array.isArray(downloads)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(downloads as Record<string, DownloadInput>).map(
      ([id, item]) => [id, normalizeDownload({...item, id: item.id || id})],
    ),
  );
};

const updateStatus = (
  downloads: Record<string, DownloadItem>,
  id: string,
  status: DownloadStatus,
  update: Partial<DownloadItem> = {},
): Record<string, DownloadItem> => {
  const item = downloads[id];
  if (!item) {
    return downloads;
  }

  return {
    ...downloads,
    [id]: {
      ...item,
      ...update,
      status,
      updatedAt: Date.now(),
    },
  };
};

type PersistedDownloads = {
  downloads: Record<string, DownloadItem>;
  storageFullHold?: boolean;
};

const PROGRESS_PERSIST_INTERVAL_MS = 1000;

const getStatusSignature = (downloads: Record<string, DownloadItem>) => {
  let signature = '';
  for (const id in downloads) {
    signature += `${id}\u0000${downloads[id].status}\u0001`;
  }
  return signature;
};

// Native progress events arrive several times a second per download, and each
// write serialized every stored download on the JS thread. A change to the set
// of downloads or to any status is written at once, with all pending changes.
// Other changes (progress, speed) are written at most once per interval, and
// pending ones are written when the app leaves the foreground.
const createDownloadsPersistStorage =
  (): PersistStorage<PersistedDownloads> => {
    const storage = createJSONStorage<PersistedDownloads>(() =>
      createZustandStorage(),
    )!;
    let pending: {
      name: string;
      value: StorageValue<PersistedDownloads>;
    } | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastSignature: string | null = null;

    const flush = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (!pending) {
        return;
      }
      const {name, value} = pending;
      pending = null;
      storage.setItem(name, value);
    };

    // Optional chaining: test environments mock react-native without AppState.
    AppState?.addEventListener?.('change', state => {
      if (state !== 'active') {
        flush();
      }
    });

    return {
      getItem: name => storage.getItem(name),
      setItem: (name, value) => {
        pending = {name, value};
        const signature = `${Boolean(value.state.storageFullHold)}:${getStatusSignature(
          value.state.downloads || {},
        )}`;
        if (signature !== lastSignature) {
          lastSignature = signature;
          flush();
          return;
        }
        if (!timer) {
          timer = setTimeout(flush, PROGRESS_PERSIST_INTERVAL_MS);
        }
      },
      removeItem: name => {
        pending = null;
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        lastSignature = null;
        return storage.removeItem(name);
      },
    };
  };

export const useDownloadsStore = create<DownloadState>()(
  persist(
    (set, get) => ({
      downloads: {},
      storageFullHold: false,

      enqueueDownload: item => {
        set(state => ({
          downloads: {
            ...state.downloads,
            [item.id]: normalizeDownload(item),
          },
        }));
      },

      addDownload: item => get().enqueueDownload(item),

      updateDownload: (id, update) => {
        set(state => {
          const item = state.downloads[id];
          if (!item) {
            return state;
          }
          return {
            downloads: {
              ...state.downloads,
              [id]: {
                ...item,
                ...update,
                id,
                updatedAt: Date.now(),
              },
            },
          };
        });
      },

      updateProgress: (id, downloaded, total, speed) => {
        set(state => {
          const item = state.downloads[id];
          if (!item) {
            return state;
          }
          const preservePausedState =
            item.status === 'paused' || item.status === 'pausing';
          return {
            downloads: updateStatus(
              state.downloads,
              id,
              preservePausedState ? item.status : 'downloading',
              {
                downloadedBytes: downloaded,
                totalBytes: total,
                speed: preservePausedState ? 0 : speed,
                ...(preservePausedState
                  ? {}
                  : {errorCode: undefined, errorMessage: undefined}),
              },
            ),
          };
        });
      },

      markStarting: id => {
        set(state => ({
          downloads: updateStatus(state.downloads, id, 'starting', {
            speed: 0,
          }),
        }));
      },

      markPaused: id => {
        set(state => ({
          downloads: updateStatus(state.downloads, id, 'paused', {speed: 0}),
        }));
      },

      markInterrupted: (id, message) => {
        set(state => ({
          downloads: updateStatus(state.downloads, id, 'interrupted', {
            speed: 0,
            errorMessage: message || 'Download was interrupted',
            retryable: true,
          }),
        }));
      },

      markFinalizing: id => {
        set(state => ({
          downloads: updateStatus(state.downloads, id, 'finalizing', {
            speed: 0,
          }),
        }));
      },

      markCompleted: (id, output) => {
        set(state => {
          const item = state.downloads[id];
          if (!item) {
            return state;
          }
          const totalBytes = output?.totalBytes ?? item.totalBytes;
          return {
            downloads: updateStatus(state.downloads, id, 'completed', {
              ...output,
              speed: 0,
              downloadedBytes: totalBytes || item.downloadedBytes,
              totalBytes,
              completedAt: Date.now(),
              errorCode: undefined,
              errorMessage: undefined,
              retryable: undefined,
              canPause: false,
              canResume: false,
              headers: undefined,
            }),
          };
        });
      },

      markError: (id, error = {}) => {
        set(state => ({
          downloads: updateStatus(state.downloads, id, 'error', {
            speed: 0,
            canPause: false,
            canResume: false,
            errorCode: error.code,
            errorMessage: error.message,
            retryable: error.retryable ?? true,
          }),
        }));
      },

      markMissing: (id, message) => {
        set(state => ({
          downloads: updateStatus(state.downloads, id, 'missing', {
            speed: 0,
            errorMessage: message || 'Downloaded file is missing',
            retryable: false,
          }),
        }));
      },

      markCanceling: id => {
        set(state => ({
          downloads: updateStatus(state.downloads, id, 'canceling', {
            speed: 0,
          }),
        }));
      },

      pauseDownload: id => get().markPaused(id),
      resumeDownload: id => get().markStarting(id),
      cancelDownload: id => get().markCanceling(id),

      removeDownload: id => {
        set(state => {
          const downloads = {...state.downloads};
          delete downloads[id];
          return {downloads};
        });
      },

      getDownload: id => get().downloads[id],
      getDownloadByMediaId: id => get().downloads[id],

      reconcileDownloads: () => {
        set(state => {
          const now = Date.now();
          const downloads = Object.fromEntries(
            Object.entries(state.downloads).map(([id, item]) => {
              if (!INTERRUPTIBLE_STATUSES.has(item.status)) {
                return [id, item];
              }
              if (item.sourceType === 'hls' && (item.status === 'paused' || item.status === 'pausing')) {
                return [id, {...item, status: 'paused' as const, speed: 0, canPause: false, canResume: true, updatedAt: now}];
              }
              return [
                id,
                {
                  ...item,
                  status: 'interrupted' as const,
                  speed: 0,
                  canPause: false,
                  canResume: false,
                  errorMessage: 'Download was interrupted',
                  retryable: true,
                  updatedAt: now,
                },
              ];
            }),
          );
          return {downloads};
        });
      },
    }),
    {
      name: DOWNLOADS_STORAGE_KEY,
      version: DOWNLOADS_SCHEMA_VERSION,
      storage: createDownloadsPersistStorage(),
      partialize: state => ({
        downloads: state.downloads,
        storageFullHold: state.storageFullHold,
      }),
      migrate: persistedState => {
        const persisted = persistedState as
          | {
              downloads?: Record<string, DownloadInput>;
              storageFullHold?: boolean;
            }
          | undefined;
        return {
          downloads: normalizePersistedDownloads(persisted?.downloads),
          storageFullHold: persisted?.storageFullHold === true,
        };
      },
      merge: (persistedState, currentState) => {
        const persisted = persistedState as
          | {
              downloads?: Record<string, DownloadInput>;
              storageFullHold?: boolean;
            }
          | undefined;
        const legacyDownloads = migrateLegacyDownloads(
          downloadsStorage.takeLegacyDownloads(),
        );
        return {
          ...currentState,
          storageFullHold: persisted?.storageFullHold === true,
          downloads: {
            ...legacyDownloads,
            ...normalizePersistedDownloads(persisted?.downloads),
          },
        };
      },
    },
  ),
);

export const selectCurrentDownloads = (state: DownloadState): DownloadItem[] =>
  Object.values(state.downloads)
    .filter(item => CURRENT_DOWNLOAD_STATUSES.has(item.status))
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));

export const isSubtitleDownloadItem = (item: DownloadItem): boolean => {
  if (item.isSubtitle) return true;
  if (item.id.includes('_subtitle_')) return true;
  const vt = (item.videoType || '').toLowerCase();
  if (
    vt === 'vtt' ||
    vt === 'srt' ||
    vt === 'text/vtt' ||
    vt === 'subrip' ||
    vt.includes('vtt') ||
    vt.includes('srt')
  ) {
    return true;
  }
  return false;
};

export const selectCompletedDownloads = (
  state: DownloadState,
): DownloadItem[] =>
  Object.values(state.downloads).filter(
    item => item.status === 'completed' && !isSubtitleDownloadItem(item),
  );

export const selectMissingDownloads = (state: DownloadState): DownloadItem[] =>
  Object.values(state.downloads).filter(
    item => item.status === 'missing' && !isSubtitleDownloadItem(item),
  );

export const selectFailedDownloads = (state: DownloadState): DownloadItem[] =>
  Object.values(state.downloads).filter(
    item =>
      (item.status === 'error' || item.status === 'interrupted') &&
      !isSubtitleDownloadItem(item),
  );

export default useDownloadsStore;

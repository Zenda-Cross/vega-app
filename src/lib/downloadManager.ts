import {
  finalizeDownloadOutput,
  discardDownloadDestination,
  isDownloadDestinationEmpty,
  PreparedDownloadDestination,
  prepareDownloadDestination,
} from './downloadDestination';
import {
  DownloadLocationConfig,
  ensureDownloadLocationAccess,
  isSafDownloadLocation,
} from './downloadLocation';
import {notificationService} from './services/Notification';
import useDownloadsStore, {
  CURRENT_DOWNLOAD_STATUSES,
  DownloadItem,
} from './zustand/downloadsStore';
import {getDownloadBackend} from './downloadBackends/registry';
import {
  DownloadBackend,
  DownloadBackendContext,
  DownloadPauseSupportError,
} from './downloadBackends/types';
import {settingsStorage} from './storage';
import {
  createDownloadDirectoryName,
  createDownloadSeasonDirectoryName,
} from './downloadId';
import {getCachedImageAccent} from './imageAccent';
import {mixHex} from '../theme/seeds';
import {formatDownloadProgressLabel} from './downloadFormatting';
import {
  canRefreshDownloadSource,
  fetchDownloadSourceStreams,
  isExpiredLinkError,
  refreshDownloadSource,
} from './downloadSourceRefresh';
import {DownloadPausedError} from './downloadBackends/types';
import {canTryNextDownloadServer, downloadServerKey, getNextDownloadServer} from './downloadServerFallback';
import type {Stream} from './providers/types';

const activeDownloads = new Set<string>();
const sourceRefreshControllers = new Map<string, AbortController>();
const occupiedDownloadSlots = new Set<string>();
const cancelledDownloads = new Set<string>();
const pauseFailedDownloads = new Set<string>();
const lastNotificationAt = new Map<string, number>();
const downloadNotificationColors = new Map<string, Promise<string>>();
let schedulerRunning = false;
const HTTP_START_RETRY_DELAYS_MS = [750, 1500];
const HTTP_DNS_RETRY_DELAYS_MS = [1000, 2000, 4000, 8000];

const wait = (milliseconds: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

const getDownloadNotificationColor = (
  record: DownloadItem,
): Promise<string> => {
  const cached = downloadNotificationColors.get(record.id);
  if (cached) {
    return cached;
  }
  const image = record.background || record.poster;
  const raw = image
    ? getCachedImageAccent?.('shared-image-accent-v3:' + image)
    : undefined;
  // Starting a download must never wait on decorative image/network work.
  const color = Promise.resolve(
    raw ? mixHex(raw, '#FFFFFF', 0.35) : settingsStorage.getPrimaryColor(),
  );
  downloadNotificationColors.set(record.id, color);
  return color;
};

const isTransientHttpStartError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  return (
    normalized.includes('software caused connection abort') ||
    normalized.includes('connection aborted') ||
    normalized.includes('connection reset') ||
    normalized.includes('network connection was lost') ||
    normalized.includes('unable to resolve host') ||
    normalized.includes('no address associated with hostname') ||
    normalized.includes('unknown host') ||
    normalized.includes('name or service not known') ||
    normalized.includes('temporary failure in name resolution') ||
    normalized.includes('network is unreachable') ||
    normalized.includes('connection timed out') ||
    normalized.includes('connect timeout')
  );
};

// Android reports a full disk as ENOSPC. The next queued download would fail
// the same way, so the queue waits for the user to free space and retry.
export const isStorageFullError = (message: string): boolean =>
  /ENOSPC|no space left/i.test(message);

const isDnsResolutionError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  return (
    normalized.includes('unable to resolve host') ||
    normalized.includes('no address associated with hostname') ||
    normalized.includes('unknown host') ||
    normalized.includes('name or service not known') ||
    normalized.includes('temporary failure in name resolution')
  );
};

const startBackendWithRetry = async (
  backend: DownloadBackend,
  context: DownloadBackendContext,
): Promise<void> => {
  let attempt = 0;
  while (true) {
    try {
      await backend.start(context);
      return;
    } catch (error) {
      const retryDelays = isDnsResolutionError(error)
        ? HTTP_DNS_RETRY_DELAYS_MS
        : HTTP_START_RETRY_DELAYS_MS;
      const canRetry =
        attempt < retryDelays.length &&
        context.record.sourceType === 'http' &&
        !cancelledDownloads.has(context.record.id) &&
        isTransientHttpStartError(error);
      if (!canRetry) {
        throw error;
      }
      useDownloadsStore.getState().updateDownload(context.record.id, {
        status: 'starting',
        ...(backend.preservePartialOnFailure
          ? {}
          : {downloadedBytes: 0, totalBytes: 0}),
        speed: 0,
        canPause: false,
        canResume: false,
      });
      await wait(retryDelays[attempt]);
      attempt += 1;
      if (cancelledDownloads.has(context.record.id)) {
        throw new Error('Download cancelled');
      }
    }
  }
};

export const waitForDownloadsHydration = async (): Promise<void> => {
  if (useDownloadsStore.persist.hasHydrated()) {
    return;
  }
  await new Promise<void>(resolve => {
    let unsubscribe: () => void = () => undefined;
    unsubscribe = useDownloadsStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
    useDownloadsStore.persist.rehydrate();
  });
};

const showProgressNotification = async (
  record: DownloadItem,
): Promise<void> => {
  const now = Date.now();
  const previous = lastNotificationAt.get(record.id) || 0;
  if (now - previous < 1000) {
    return;
  }
  lastNotificationAt.set(record.id, now);
  const progress = record.totalBytes
    ? record.downloadedBytes / record.totalBytes
    : 0;
  const color = await getDownloadNotificationColor(record);
  await notificationService.showDownloadProgress(
    record.title,
    record.id,
    progress,
    formatDownloadProgressLabel(record),
    record.sourceType,
    record.canPause ? 'pause' : record.canResume ? 'resume' : 'none',
    color,
    !record.totalBytes,
  );
};

const showCurrentDownloadNotification = async (
  record: DownloadItem,
): Promise<void> => {
  const progress = record.totalBytes
    ? record.downloadedBytes / record.totalBytes
    : 0;
  const color = await getDownloadNotificationColor(record);
  const isPaused = record.status === 'paused';
  const progressLabel = formatDownloadProgressLabel(record);
  const body = isPaused
    ? record.errorCode === 'NETWORK_INTERRUPTED'
      ? record.totalBytes
        ? `Waiting for network - ${progressLabel}`
        : 'Waiting for network'
      : record.totalBytes
        ? `Paused - ${progressLabel}`
        : 'Paused'
    : progressLabel;

  await notificationService.showDownloadProgress(
    record.title,
    record.id,
    progress,
    body,
    record.sourceType,
    isPaused ? 'resume' : record.canPause ? 'pause' : 'none',
    color,
    !record.totalBytes && !isPaused,
  );
};

const getRecord = (downloadId: string): DownloadItem => {
  const record = useDownloadsStore.getState().getDownload(downloadId);
  if (!record) {
    throw new Error(`Download ${downloadId} is not registered`);
  }
  return record;
};

const getOutputName = (record: DownloadItem): string =>
  record.displayFileName?.replace(/\.[^.]+$/, '') || record.title;

const getOutputDirectoryNames = (record: DownloadItem): string[] => [
  createDownloadDirectoryName(record.showName || record.title),
  ...[createDownloadSeasonDirectoryName(record.seasonTitle)].filter(
    (name): name is string => Boolean(name),
  ),
];

const getQueuedDownloads = (): DownloadItem[] =>
  Object.values(useDownloadsStore.getState().downloads)
    .filter(item => item.status === 'queued' && item.downloadLocation &&
      !(activeDownloads.has(item.id) && getDownloadBackend(item.sourceType).restartOnResume))
    .sort((left, right) =>
      left.createdAt === right.createdAt
        ? left.id.localeCompare(right.id)
        : left.createdAt - right.createdAt,
    );

// A link that expired before any data arrived (a queued download that waited
// too long) is fetched again once from the same server. Partial data stays
// with its original link, as a new link cannot resume it safely.
const startBackendWithFreshLink = async (
  backend: DownloadBackend,
  context: DownloadBackendContext,
  onStreams?: (streams: Stream[] | undefined) => void,
): Promise<void> => {
  try {
    await startBackendWithRetry(backend, context);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const resumableHls = context.record.sourceType === 'hls' && backend.preserveStagingOnFailure;
    if (
      cancelledDownloads.has(context.record.id) ||
      pauseFailedDownloads.has(context.record.id) ||
      !canRefreshDownloadSource(context.record) ||
      (!resumableHls && getRecord(context.record.id).downloadedBytes > 0) ||
      !isExpiredLinkError(message)
    ) {
      throw error;
    }
    const id = context.record.id;
    const canContinue = () => {
      const current = useDownloadsStore.getState().getDownload(id);
      return current && (resumableHls || current.downloadedBytes === 0) &&
        current.url === context.record.url && current.createdAt === context.record.createdAt &&
        (current.status === 'starting' || current.status === 'downloading') &&
        !cancelledDownloads.has(id) && !pauseFailedDownloads.has(id);
    };
    // Persisted progress can lag behind native writes. Check the actual
    // destination (and HLS segment directory), failing closed on metadata errors.
    if (!canContinue() || (!resumableHls && !await isDownloadDestinationEmpty(context.destination))) {
      throw error;
    }
    if (!canContinue()) throw error;
    const controller = new AbortController();
    sourceRefreshControllers.set(id, controller);
    let fresh: Awaited<ReturnType<typeof refreshDownloadSource>>;
    try {
      fresh = await refreshDownloadSource(context.record, controller.signal, onStreams);
    } finally {
      if (sourceRefreshControllers.get(id) === controller) {
        sourceRefreshControllers.delete(id);
      }
    }
    if (!fresh || !canContinue() ||
      (!resumableHls && !await isDownloadDestinationEmpty(context.destination)) || !canContinue()) {
      throw error;
    }
    useDownloadsStore.getState().updateDownload(id, fresh);
    await startBackendWithRetry(backend, {
      ...context,
      record: getRecord(context.record.id),
    });
  }
};

export const scheduleQueuedDownloads = async (): Promise<void> => {
  if (schedulerRunning || useDownloadsStore.getState().storageFullHold) {
    return;
  }
  schedulerRunning = true;
  try {
    const concurrency = settingsStorage.getDownloadConcurrency();
    const availableSlots = Math.max(
      concurrency - occupiedDownloadSlots.size,
      0,
    );
    const queued = getQueuedDownloads();
    queued.slice(0, availableSlots).forEach(record => {
      startOrResumeQueuedDownload(record).catch(() => undefined);
    });
    queued.slice(availableSlots).forEach(record => {
      getDownloadNotificationColor(record)
        .then(color =>
          notificationService.showDownloadQueued(
            record.title,
            record.id,
            record.sourceType,
            color,
          ),
        )
        .catch(() => undefined);
    });
  } finally {
    schedulerRunning = false;
  }
};

export const startQueuedDownloadNow = async (
  downloadId: string,
): Promise<void> => {
  const record = getRecord(downloadId);
  if (record.status !== 'queued' || !record.downloadLocation) {
    return;
  }
  useDownloadsStore.setState({storageFullHold: false});
  await startOrResumeQueuedDownload(record);
};

// A paused download that still has a live job waits in the queue to resume.
const startOrResumeQueuedDownload = (record: DownloadItem): Promise<void> =>
  activeDownloads.has(record.id)
    ? getDownloadBackend(record.sourceType).restartOnResume ? Promise.resolve() : resumeLiveDownload(record.id)
    : startDownload(record.id, record.downloadLocation!);

export const startDownload = async (
  downloadId: string,
  location: DownloadLocationConfig,
): Promise<void> => {
  if (activeDownloads.has(downloadId)) {
    return;
  }

  let record = getRecord(downloadId);
  const backend = getDownloadBackend(record.sourceType);
  const store = useDownloadsStore.getState();
  activeDownloads.add(downloadId);
  occupiedDownloadSlots.add(downloadId);
  cancelledDownloads.delete(downloadId);
  pauseFailedDownloads.delete(downloadId);
  store.markStarting(downloadId);
  const subscriptions: Array<() => void> = [];
  let destination: PreparedDownloadDestination | undefined;
  const throwIfCancelled = (): void => {
    if (cancelledDownloads.has(downloadId)) {
      throw new Error('Download cancelled');
    }
  };
  const prepareDestination = (existingFinalDocumentUri?: string) =>
    prepareDownloadDestination({
      downloadId,
      location,
      fileName: getOutputName(record),
      fileType: record.videoType || 'mp4',
      directToSaf: backend.directToSaf && isSafDownloadLocation(location),
      preserveStaging: backend.preserveStagingOnFailure,
      existingFinalDocumentUri,
      outputDirectoryNames: getOutputDirectoryNames(record),
    });

  try {
    try {
      await notificationService.startForegroundTask(downloadId);
    } catch (error) {
      console.warn(
        `Foreground service unavailable for download ${downloadId}:`,
        error,
      );
    }
    await notificationService
      .cancelNotification(downloadId)
      .catch(() => undefined);
    await notificationService.ensureDownloadPermission().catch(() => false);
    await notificationService.showDownloadStarting(
      record.title,
      downloadId,
      record.sourceType,
      await getDownloadNotificationColor(record),
    );
    throwIfCancelled();
    subscriptions.push(
      useDownloadsStore.subscribe((state, previousState) => {
        if (
          previousState &&
          state.downloads[downloadId] === previousState.downloads[downloadId]
        )
          return;
        const updatedRecord = state.downloads[downloadId];
        if (updatedRecord?.status === 'downloading') {
          showProgressNotification(updatedRecord).catch(() => undefined);
        } else if (
          updatedRecord?.status === 'paused' &&
          updatedRecord.errorCode === 'NETWORK_INTERRUPTED'
        ) {
          showCurrentDownloadNotification(updatedRecord).catch(() => undefined);
        }
      }),
    );
    destination = await prepareDestination(record.finalDocumentUri);
    throwIfCancelled();
    store.updateDownload(downloadId, {
      stagingPath: destination.stagingPath,
      finalDocumentUri: destination.directFinalDocumentUri,
      downloadLocation: location,
    });
    const attemptedServers = new Set<string>();
    const attemptedUrls = new Set<string>();
    let alternativesLoaded = false;
    let alternatives: Stream[] | undefined;
    let firstServer = true;
    const rememberAlternatives = (streams: Stream[] | undefined) => {
      if (alternativesLoaded) return;
      alternativesLoaded = true;
      alternatives = streams;
    };
    while (true) {
      attemptedServers.add(downloadServerKey(record.server));
      attemptedUrls.add(record.url);
      try {
        if (firstServer) {
          await startBackendWithFreshLink(backend, {record, destination}, rememberAlternatives);
        } else {
          // Alternatives already came from this fresh provider response.
          await startBackendWithRetry(backend, {record, destination});
        }
        break;
      } catch (error) {
        const failedRecord = store.getDownload(downloadId);
        if (!settingsStorage.isAutoDownloadServerFallbackEnabled() ||
          !failedRecord || !canTryNextDownloadServer(failedRecord, error)) throw error;
        record = failedRecord;
        attemptedUrls.add(record.url);
        const canContinue = () => {
          const current = store.getDownload(downloadId);
          return current && current.createdAt === failedRecord.createdAt &&
            current.url === failedRecord.url && canTryNextDownloadServer(current, error) &&
            settingsStorage.isAutoDownloadServerFallbackEnabled() &&
            (current.status === 'starting' || current.status === 'downloading') &&
            !cancelledDownloads.has(downloadId) && !pauseFailedDownloads.has(downloadId) &&
            !useDownloadsStore.getState().storageFullHold;
        };
        if (!canContinue()) throw error;
        if (!alternativesLoaded) {
          const controller = new AbortController();
          sourceRefreshControllers.set(downloadId, controller);
          try {
            rememberAlternatives(await fetchDownloadSourceStreams(record, controller.signal));
          } finally {
            if (sourceRefreshControllers.get(downloadId) === controller) {
              sourceRefreshControllers.delete(downloadId);
            }
          }
        }
        if (!canContinue() || !alternatives) throw error;
        const next = getNextDownloadServer(alternatives, record, attemptedServers, attemptedUrls);
        if (!next) throw error;

        // Different hosts may serve different encodes/byte layouts. Remove
        // every old partial and verify SAF deletion before creating a new output.
        await backend.cleanup(downloadId, record);
        if (!canContinue()) throw error;
        await discardDownloadDestination(downloadId, destination);
        if (!canContinue()) throw error;
        destination = await prepareDestination();
        if (!canContinue()) throw error;
        store.updateDownload(downloadId, {
          url: next.link,
          server: next.server,
          headers: next.headers,
          skip: next.skip || record.skip,
          downloadedBytes: 0,
          totalBytes: 0,
          speed: 0,
          backendJobId: undefined,
          status: 'starting',
          canPause: false,
          canResume: false,
          stagingPath: destination.stagingPath,
          finalDocumentUri: destination.directFinalDocumentUri,
        });
        record = getRecord(downloadId);
        firstServer = false;
      }
    }
    throwIfCancelled();

    store.markFinalizing(downloadId);
    const output = await finalizeDownloadOutput({
      downloadId,
      location,
      stagingPath: destination.stagingPath,
      fileName: getOutputName(record),
      fileType: record.videoType || 'mp4',
      outputDirectoryNames: getOutputDirectoryNames(record),
      directFinalDocumentUri: destination.directFinalDocumentUri,
    });
    store.markCompleted(downloadId, {
      filePath: output.filePath,
      finalDocumentUri: output.finalDocumentUri,
      totalBytes: output.size,
    });
    await notificationService.showDownloadComplete(
      record.title,
      downloadId,
      record.sourceType,
      await getDownloadNotificationColor(record),
    );
  } catch (error) {
    if (error instanceof DownloadPausedError && !cancelledDownloads.has(downloadId)) return;
    const cancelled = cancelledDownloads.has(downloadId);
    const pauseFailed = pauseFailedDownloads.has(downloadId);
    const message = error instanceof Error ? error.message : String(error);
    const pauseUnsupported = error instanceof DownloadPauseSupportError;
    const storageFull = !cancelled && !pauseFailed && !pauseUnsupported &&
      isStorageFullError(message);
    if (storageFull) {
      // Gate every scheduler entry point before asynchronous cleanup can let
      // a concurrent completion/cancellation start more queued work.
      useDownloadsStore.setState({storageFullHold: true});
    }
    if (!backend.preserveStagingOnFailure && (!backend.preservePartialOnFailure || !isSafDownloadLocation(location))) {
      await backend.cleanup(downloadId, record).catch(() => undefined);
    } else if (cancelled && destination) {
      await backend
        .cleanup(downloadId, {
          ...record,
          downloadLocation: location,
          finalDocumentUri: destination.directFinalDocumentUri,
        })
        .catch(() => undefined);
    }
    if (cancelled) {
      // A new download with the same id may have been queued after cancel.
      if (store.getDownload(downloadId)?.status === 'canceling') {
        store.removeDownload(downloadId);
      }
      await notificationService.cancelNotification(downloadId);
      return;
    }
    if (pauseFailed) {
      return;
    }

    store.markError(downloadId, {
      code: pauseUnsupported
        ? 'PAUSE_UNSUPPORTED'
        : storageFull
          ? 'STORAGE_FULL'
          : undefined,
      message: storageFull
        ? 'Not enough storage space. Free some space and retry.'
        : message,
      retryable: !pauseUnsupported,
    });
    await notificationService.showDownloadFailed(
      record.title,
      downloadId,
      record.sourceType,
      await getDownloadNotificationColor(record),
    );
    throw error;
  } finally {
    subscriptions.forEach(unsubscribe => unsubscribe());
    activeDownloads.delete(downloadId);
    occupiedDownloadSlots.delete(downloadId);
    cancelledDownloads.delete(downloadId);
    pauseFailedDownloads.delete(downloadId);
    lastNotificationAt.delete(downloadId);
    downloadNotificationColors.delete(downloadId);
    // A stopped HLS job may immediately restart with the same ID. Release its
    // foreground reference first so old teardown cannot stop the resumed job.
    if (backend.restartOnResume) await notificationService.stopForegroundTask(downloadId).catch(() => undefined);
    await scheduleQueuedDownloads();
    if (!backend.restartOnResume) await notificationService.stopForegroundTask(downloadId).catch(() => undefined);
  }
};

const failPausedDownload = async (
  downloadId: string,
  operation: 'pause' | 'resume',
  error: unknown,
): Promise<void> => {
  const record = getRecord(downloadId);
  const backend = getDownloadBackend(record.sourceType);
  sourceRefreshControllers.get(downloadId)?.abort();
  const detail = error instanceof Error ? error.message : String(error);
  const message = `Unable to ${operation} this download. Partial download data was deleted. ${detail}`;
  if (activeDownloads.has(downloadId)) {
    pauseFailedDownloads.add(downloadId);
  }
  await backend.cancel(downloadId).catch(() => undefined);
  await backend.cleanup(downloadId, record).catch(() => undefined);
  useDownloadsStore.getState().markError(downloadId, {
    code: 'PAUSE_UNSUPPORTED',
    message,
    retryable: false,
  });
  await notificationService.showDownloadFailed(
    record.title,
    downloadId,
    record.sourceType,
    await getDownloadNotificationColor(record),
  );
};

export const pauseDownload = async (downloadId: string): Promise<void> => {
  const record = getRecord(downloadId);
  const backend = getDownloadBackend(record.sourceType);
  if (
    !backend.pause ||
    !record.canPause ||
    (record.status !== 'downloading' && record.status !== 'starting')
  ) {
    return;
  }
  useDownloadsStore.getState().updateDownload(downloadId, {
    status: 'pausing',
    speed: 0,
    canPause: false,
  });
  try {
    await backend.pause(downloadId);
    useDownloadsStore.getState().updateDownload(downloadId, {
      status: 'paused',
      speed: 0,
      canPause: false,
      canResume: true,
    });
    occupiedDownloadSlots.delete(downloadId);
    await showCurrentDownloadNotification(getRecord(downloadId));
    scheduleQueuedDownloads().catch(() => undefined);
  } catch (error) {
    await failPausedDownload(downloadId, 'pause', error);
  }
};

export const resumeDownload = async (downloadId: string): Promise<void> => {
  const record = getRecord(downloadId);
  const backend = getDownloadBackend(record.sourceType);
  if (!backend.resume || !record.canResume || record.status !== 'paused') {
    return;
  }
  useDownloadsStore.setState({storageFullHold: false});
  // With no live job (for example after an app restart) the backend has
  // nothing to resume, so start the download again from the queue.
  if (!activeDownloads.has(downloadId) || backend.restartOnResume) {
    useDownloadsStore.getState().updateDownload(downloadId, {
      status: 'queued',
      canPause: false,
      canResume: false,
    });
    await scheduleQueuedDownloads();
    return;
  }
  // Pausing gave this download's slot to the queue. Wait for a free slot
  // instead of exceeding the concurrency limit.
  if (
    !occupiedDownloadSlots.has(downloadId) &&
    occupiedDownloadSlots.size >= settingsStorage.getDownloadConcurrency()
  ) {
    useDownloadsStore.getState().updateDownload(downloadId, {
      status: 'queued',
      canPause: false,
      canResume: false,
    });
    await scheduleQueuedDownloads();
    return;
  }
  await resumeLiveDownload(downloadId);
};

const resumeLiveDownload = async (downloadId: string): Promise<void> => {
  const record = getRecord(downloadId);
  const backend = getDownloadBackend(record.sourceType);
  if (!backend.resume) {
    return;
  }
  if (record.errorCode !== 'NETWORK_INTERRUPTED') {
    useDownloadsStore.getState().updateDownload(downloadId, {
      status: 'starting',
      canPause: false,
      canResume: false,
    });
  }
  if (activeDownloads.has(downloadId)) {
    occupiedDownloadSlots.add(downloadId);
  }
  try {
    await backend.resume(downloadId);
    if (record.errorCode !== 'NETWORK_INTERRUPTED') {
      useDownloadsStore.getState().updateDownload(downloadId, {
        status: 'downloading',
        canPause: true,
        canResume: false,
      });
    }
    await showCurrentDownloadNotification(getRecord(downloadId));
  } catch (error) {
    occupiedDownloadSlots.delete(downloadId);
    scheduleQueuedDownloads().catch(() => undefined);
    await failPausedDownload(downloadId, 'resume', error);
  }
};

export const cancelDownload = async (downloadId: string): Promise<void> => {
  const record = useDownloadsStore.getState().getDownload(downloadId);
  // A finished download can still get a cancel from a dialog or notification
  // opened before it completed. Cleanup would delete the saved file.
  if (!record || !CURRENT_DOWNLOAD_STATUSES.has(record.status)) {
    return;
  }

  cancelledDownloads.add(downloadId);
  sourceRefreshControllers.get(downloadId)?.abort();
  useDownloadsStore.getState().markCanceling(downloadId);
  const backend = getDownloadBackend(record.sourceType);
  try {
    await backend.cancel(downloadId);
  } finally {
    occupiedDownloadSlots.delete(downloadId);
    await backend.cleanup(downloadId, record).catch(() => undefined);
    useDownloadsStore.getState().removeDownload(downloadId);
    if (!activeDownloads.has(downloadId)) {
      cancelledDownloads.delete(downloadId);
    }
    await notificationService.cancelNotification(downloadId);
    scheduleQueuedDownloads().catch(() => undefined);
  }
};

export const retryDownload = async (downloadId: string): Promise<void> => {
  const record = useDownloadsStore.getState().getDownload(downloadId);
  if (!record || !record.retryable) {
    return;
  }
  const location = await ensureDownloadLocationAccess(
    record.downloadLocation || settingsStorage.getDownloadLocationConfig(),
  );
  if (!location) {
    return;
  }
  if (useDownloadsStore.getState().getDownload(downloadId) !== record) return;
  settingsStorage.setDownloadLocation(location);
  // The normal start path handles expired URLs inside the active lifecycle,
  // so Retry has no untracked provider await that can resurrect cancelled work.
  useDownloadsStore.setState({storageFullHold: false});
  useDownloadsStore.getState().updateDownload(downloadId, {
    downloadLocation: location,
    errorCode: undefined,
    errorMessage: undefined,
    retryable: undefined,
    status: 'queued',
  });
  await scheduleQueuedDownloads();
};

export const updateDownloadConcurrency = (concurrency: number): void => {
  settingsStorage.setDownloadConcurrency(concurrency);
  scheduleQueuedDownloads().catch(() => undefined);
};

export const isDownloadActive = (downloadId: string): boolean =>
  activeDownloads.has(downloadId);

import {cleanupDownloadStaging} from '../downloadDestination';
import {cancelHlsDownload, hlsDownloader2, pauseHlsDownload} from '../hlsDownloader2';
import useDownloadsStore from '../zustand/downloadsStore';
import {settingsStorage} from '../storage';
import type {DownloadBackend, DownloadBackendContext} from './types';

export const hlsDownloadBackend: DownloadBackend = {
  preserveStagingOnFailure: true,
  restartOnResume: true,
  async start({record, destination}: DownloadBackendContext): Promise<void> {
    await hlsDownloader2({
      downloadId: record.id,
      videoUrl: record.url,
      path: destination.stagingPath,
      title: record.title,
      tempDirectory: `${destination.stagingDirectory}/segments`,
      headers: record.headers,
      connections: settingsStorage.getDownloadConnections(),
      onJobStarted: backendJobId =>
        useDownloadsStore.getState().updateDownload(record.id, {
          backendJobId,
          status: 'downloading',
          canPause: false,
          canResume: false,
        }),
      onProgress: (completedSegments, totalSegments) =>
        useDownloadsStore
          .getState()
          .updateProgress(record.id, completedSegments, totalSegments, 0),
      onFinalizing: () => useDownloadsStore.getState().updateDownload(record.id, {canPause: false, canResume: false, status: 'finalizing'}),
      onResumable: canPause => useDownloadsStore.getState().updateDownload(record.id, {canPause}),
      onCompleted: () => undefined,
    });
  },

  pause: pauseHlsDownload,
  async resume(): Promise<void> {}, // Resume is restarted through the manager queue.

  async cancel(downloadId: string): Promise<void> {
    await cancelHlsDownload(downloadId);
  },

  async cleanup(downloadId: string): Promise<void> {
    await cleanupDownloadStaging(downloadId);
  },
};

import type {PreparedDownloadDestination} from '../downloadDestination';
import type {DownloadItem} from '../zustand/downloadsStore';

export interface DownloadBackendContext {
  record: DownloadItem;
  destination: PreparedDownloadDestination;
}

export interface DownloadBackend {
  directToSaf?: boolean;
  preservePartialOnFailure?: boolean;
  preserveStagingOnFailure?: boolean;
  restartOnResume?: boolean;
  start(context: DownloadBackendContext): Promise<void>;
  pause?(downloadId: string): Promise<void>;
  resume?(downloadId: string): Promise<void>;
  cancel(downloadId: string): Promise<void>;
  cleanup(downloadId: string, record?: DownloadItem): Promise<void>;
}

export class DownloadPauseSupportError extends Error {
  constructor(message = 'This server does not support pausing this download') {
    super(message);
    this.name = 'DownloadPauseSupportError';
  }
}

export class DownloadPausedError extends Error {
  constructor() { super('Download paused'); this.name = 'DownloadPausedError'; }
}

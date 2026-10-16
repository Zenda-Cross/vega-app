import {DownloadPauseSupportError, DownloadPausedError} from './downloadBackends/types';
import {canRefreshDownloadSource, pickRefreshedStream} from './downloadSourceRefresh';
import type {Stream} from './providers/types';
import type {DownloadItem} from './zustand/downloadsStore';

export const isBelowOnePercent = (record: DownloadItem): boolean => {
  const {downloadedBytes, totalBytes} = record;
  if (!Number.isFinite(downloadedBytes) || downloadedBytes < 0) return false;
  if (downloadedBytes === 0) return true;
  return Number.isFinite(totalBytes) && totalBytes > 0 && downloadedBytes * 100 < totalBytes;
};

export const canTryNextDownloadServer = (record: DownloadItem, error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);
  return canRefreshDownloadSource(record) && isBelowOnePercent(record) &&
    !(error instanceof DownloadPausedError) && !(error instanceof DownloadPauseSupportError) &&
    !/ENOSPC|no space left|EACCES|EPERM|permission|destination|download location|cancelled|canceled/i.test(message);
};

export const downloadServerKey = (server?: string): string => server?.trim().toLowerCase() || '';

// Keep provider order, but never silently change quality/container or guess
// between multiple releases from the same server. Each server is tried once.
export const getNextDownloadServer = (
  streams: Stream[],
  record: DownloadItem,
  attemptedServers: ReadonlySet<string>,
  attemptedUrls: ReadonlySet<string>,
): Stream | undefined => {
  const groups = new Map<string, Stream[]>();
  for (const stream of streams) {
    const key = downloadServerKey(stream?.server);
    if (!key || attemptedServers.has(key) || attemptedUrls.has(stream.link)) continue;
    const group = groups.get(key) || [];
    group.push(stream);
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    const candidate = pickRefreshedStream(group, {...record, server: group[0].server, url: ''});
    if (candidate) return candidate;
  }
  return undefined;
};

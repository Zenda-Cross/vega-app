import {isSubtitleDownloadItem} from './downloadId';
import type {Stream} from './providers/types';
import type {DownloadItem} from './zustand/downloadsStore';

// Stream links and the cookies in their headers expire. A download queued
// behind others, or retried later, can then fail with one of these statuses.
const EXPIRED_LINK_ERROR =
  /\b(?:HTTP(?: status)?|status:?)\s*(?:401|403|404|410)\b/i;

const REFRESH_TIMEOUT_MS = 45_000;

export const isExpiredLinkError = (message?: string): boolean =>
  Boolean(message && EXPIRED_LINK_ERROR.test(message));

/** Whether the provider can be asked again for this download's link. */
export const canRefreshDownloadSource = (record: DownloadItem): boolean =>
  record.sourceType !== 'torrent' &&
  !isSubtitleDownloadItem(record) &&
  Boolean(record.provider) &&
  /^https?:/i.test(record.sourceLink ?? '');

// Same rule as downloader.ts uses to pick the backend.
const streamSourceType = (stream: Stream): DownloadItem['sourceType'] => {
  if (stream.type === 'torrent' || stream.link?.startsWith('magnet:')) {
    return 'torrent';
  }
  return stream.type === 'm3u8' ? 'hls' : 'http';
};

/**
 * The fresh stream for this download: the same server with the same kind of
 * stream. Never another server, as that may be a different file.
 */
export const pickRefreshedStream = (
  streams: Stream[],
  record: DownloadItem,
): Stream | undefined => {
  if (!record.server) {
    return undefined;
  }
  const matches = streams.filter(
    stream =>
      stream?.link &&
      stream.server === record.server &&
      streamSourceType(stream) === record.sourceType,
  );
  return matches.find(stream => stream.link === record.url) ?? matches[0];
};

/**
 * Asks the provider for the download's stream again. Returns the new link and
 * headers, or undefined when there is no matching stream or the request fails.
 */
export const refreshDownloadSource = async (
  record: DownloadItem,
): Promise<Pick<DownloadItem, 'url' | 'headers'> | undefined> => {
  if (!canRefreshDownloadSource(record)) {
    return undefined;
  }
  // Loaded lazily: the provider manager pulls in the sandbox.
  const {providerManager} =
    require('./services/ProviderManager') as typeof import('./services/ProviderManager');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
  try {
    const streams = await providerManager.getStream({
      link: record.sourceLink!,
      type: record.type,
      providerValue: record.provider!,
      signal: controller.signal,
      isDownload: true,
    });
    const stream = pickRefreshedStream(streams || [], record);
    return stream ? {url: stream.link, headers: stream.headers} : undefined;
  } catch (error) {
    console.warn(`Unable to refresh the link of download ${record.id}:`, error);
    return undefined;
  } finally {
    clearTimeout(timer);
  }
};

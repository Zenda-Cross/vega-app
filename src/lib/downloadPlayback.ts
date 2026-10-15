import type {RootStackParamList} from '../App';
import {isSubtitleDownloadItem} from './downloadId';
import type {DownloadItem, DownloadStatus} from './zustand/downloadsStore';

// The download reads its stream now, or is about to.
const WATCHABLE_STATUSES: ReadonlySet<DownloadStatus> = new Set([
  'queued',
  'starting',
  'downloading',
  'pausing',
  'paused',
  'finalizing',
]);

// Player params to watch an unfinished download from the stream it reads, so
// playback starts at once and online servers stay available as fallbacks.
// The episode matches normal playback, so progress goes to the same entry.
// Torrents are left out: the player would share the download's torrent and
// delete it on exit.
export const getDownloadPlayerParams = (
  item: DownloadItem,
): RootStackParamList['Player'] | undefined => {
  if (
    !WATCHABLE_STATUSES.has(item.status) ||
    item.sourceType === 'torrent' ||
    isSubtitleDownloadItem(item) ||
    !item.url ||
    !item.sourceLink
  ) {
    return undefined;
  }
  return {
    linkIndex: 0,
    episodeList: [
      {
        title: item.episodeName || item.title,
        link: item.sourceLink,
        skip: item.skip,
      },
    ],
    type: item.type,
    primaryTitle: item.showName || item.title,
    secondaryTitle: item.seasonTitle,
    poster: {poster: item.poster, background: item.background},
    providerValue: item.provider,
    infoUrl: item.infoUrl,
    initialStream: {
      server: item.server ? `${item.server} (Downloading)` : 'Downloading',
      link: item.url,
      // HLS downloads store their mp4 output type.
      type: item.sourceType === 'hls' ? 'm3u8' : item.videoType || 'mp4',
      headers: item.headers,
      skip: item.skip,
    },
  };
};

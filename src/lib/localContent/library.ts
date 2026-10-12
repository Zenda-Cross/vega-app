import type {Info} from '../providers/types';
import type {WatchListItem} from '../storage/WatchListStorage';
import type {LocalTitle} from './model';

const PREFIX = 'vega-local:';
export const localContentLink = (id: string) =>
  `${PREFIX}${encodeURIComponent(id)}`;
export function localContentId(link: string): string | undefined {
  if (!link.startsWith(PREFIX)) return;
  try {
    return decodeURIComponent(link.slice(PREFIX.length));
  } catch {
    return;
  }
}
export const localLibraryItem = (title: LocalTitle): WatchListItem => ({
  title: title.metadata?.title || title.name,
  poster: title.metadata?.poster || '',
  link: localContentLink(title.id),
  provider: 'local',
  collections: title.collections,
});

export const localContentInfo = (title: LocalTitle): Info => ({
  title: title.metadata?.title || title.name,
  image: title.metadata?.background || title.metadata?.poster || '',
  poster: title.metadata?.poster,
  logo: title.metadata?.logo,
  synopsis: title.metadata?.description || '',
  imdbId: title.metadata?.imdbId,
  type:
    title.metadata?.type ||
    (title.episodes.length === 1 && title.episodes[0].episode === undefined
      ? 'movie'
      : 'series'),
  tags: title.metadata?.genres,
  rating: title.metadata?.rating,
  populateMeta: false,
  linkList: [],
});

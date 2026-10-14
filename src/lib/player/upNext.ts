import type {EpisodeLink} from '../providers/types';
import {getEpisodeIdentity} from '../utils/episodeIdentity';
import type {ContinueWatchingItem} from '../zustand/continueWatchingStore';

/**
 * Share of an episode after which it counts as watched. The episode list
 * ticks it off, the Resume card offers the next episode instead, and the
 * player starts it over rather than resuming near the end.
 */
export const WATCHED_FRACTION = 0.85;

export const isWatched = (position = 0, duration = 0): boolean =>
  Number.isFinite(position) &&
  Number.isFinite(duration) &&
  duration > 0 &&
  position / duration > WATCHED_FRACTION;

/** The episode after [current] in [episodes], if there is one. */
export const getNextEpisode = <T extends EpisodeLink>(
  episodes: T[] | undefined,
  current: EpisodeLink | undefined,
): T | undefined => {
  if (!episodes || !current) {
    return undefined;
  }
  const identity = getEpisodeIdentity(current);
  const index = episodes.findIndex(
    episode =>
      episode === current ||
      (identity !== '' && getEpisodeIdentity(episode) === identity),
  );
  return index < 0 ? undefined : episodes[index + 1];
};

/**
 * The Continue Watching entry once [finished] has been watched: the show
 * moves on to [next], newest in the list. [nextProgress] is what was saved
 * for [next] before; a partly watched next episode keeps it, so Resume
 * continues there.
 *
 * Returns [item] itself when nothing changes: the entry holds another
 * episode (it already moved on, so calling this again is harmless), the
 * episode is not watched yet, it is a movie, there is no next episode, or the
 * next episode is already watched (a rewatch keeps its watched history).
 */
export const getUpNextItem = (
  item: ContinueWatchingItem,
  finished: EpisodeLink,
  next: EpisodeLink | undefined,
  nextProgress = {position: 0, duration: 0},
  now = Date.now(),
): ContinueWatchingItem => {
  const finishedId = getEpisodeIdentity(finished);
  if (
    !next ||
    item.type === 'movie' ||
    !finishedId ||
    getEpisodeIdentity(item.episode) !== finishedId ||
    getEpisodeIdentity(next) === finishedId ||
    !isWatched(item.position, item.duration) ||
    isWatched(nextProgress.position, nextProgress.duration)
  ) {
    return item;
  }
  const resume = nextProgress.position > 0 && nextProgress.duration > 0;
  return {
    ...item,
    episode: next,
    episodeTitle: next.title || item.seasonTitle,
    position: resume ? nextProgress.position : 0,
    duration: resume ? nextProgress.duration : 0,
    // Later than the last progress save of the finished episode, so synced
    // devices pick the next episode as the latest one of this show.
    updatedAt: Math.max(now, item.updatedAt + 1),
  };
};

/**
 * Entries shown in the Continue Watching row, latest first. Watched movies
 * are left out. A show stays even on its last listed episode, as the next
 * season may be on the Info page.
 */
export const getContinueWatchingRow = (
  items: ContinueWatchingItem[],
): ContinueWatchingItem[] =>
  items
    .filter(
      item =>
        Boolean(item.providerValue) &&
        !(item.type === 'movie' && isWatched(item.position, item.duration)),
    )
    .sort((a, b) => b.updatedAt - a.updatedAt);

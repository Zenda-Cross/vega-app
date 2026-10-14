import {describe, expect, it} from '@jest/globals';
import {
  getContinueWatchingRow,
  getNextEpisode,
  getUpNextItem,
  isWatched,
} from '../src/lib/player/upNext';
import type {ContinueWatchingItem} from '../src/lib/zustand/continueWatchingStore';

const episode = (number: number) => ({
  title: `Episode ${number}`,
  link: `https://example.com/show/${number}`,
});

const entry = (
  overrides: Partial<ContinueWatchingItem> = {},
): ContinueWatchingItem => ({
  id: 'show',
  title: 'Show',
  episodeTitle: 'Episode 4',
  seasonTitle: 'Season 1',
  episode: episode(4),
  type: 'series',
  providerValue: 'vega',
  infoUrl: 'show',
  position: 1100,
  duration: 1200,
  updatedAt: 1000,
  ...overrides,
});

describe('isWatched', () => {
  it('counts an episode as watched past 85%, like the episode list', () => {
    expect(isWatched(850, 1000)).toBe(false);
    expect(isWatched(851, 1000)).toBe(true);
    expect(isWatched(1, 1)).toBe(true);
    expect(isWatched(0, 1)).toBe(false);
  });

  it('is false without a usable duration', () => {
    expect(isWatched(100, 0)).toBe(false);
    expect(isWatched(NaN, 100)).toBe(false);
    expect(isWatched(100, Infinity)).toBe(false);
  });
});

describe('getNextEpisode', () => {
  const list = [episode(1), episode(2), episode(3)];

  it('returns the episode after the current one', () => {
    expect(getNextEpisode(list, list[1])).toBe(list[2]);
    expect(getNextEpisode(list, {...episode(1)})).toBe(list[1]);
  });

  it('returns nothing at the end of the list or for an unknown episode', () => {
    expect(getNextEpisode(list, list[2])).toBeUndefined();
    expect(getNextEpisode(list, episode(9))).toBeUndefined();
    expect(getNextEpisode(undefined, list[0])).toBeUndefined();
    expect(getNextEpisode(list, undefined)).toBeUndefined();
  });
});

describe('getUpNextItem', () => {
  it('moves a watched episode on to the next one from the start', () => {
    expect(
      getUpNextItem(entry(), episode(4), episode(5), undefined, 2000),
    ).toEqual(
      entry({
        episode: episode(5),
        episodeTitle: 'Episode 5',
        position: 0,
        duration: 0,
        updatedAt: 2000,
      }),
    );
  });

  it('keeps the saved progress of a partly watched next episode', () => {
    const next = getUpNextItem(
      entry(),
      episode(4),
      episode(5),
      {position: 600, duration: 1300},
      2000,
    );
    expect(next).toMatchObject({position: 600, duration: 1300});
  });

  it('stays put when the next episode is already watched', () => {
    const item = entry();
    expect(
      getUpNextItem(
        item,
        episode(4),
        episode(5),
        {position: 1, duration: 1},
        2000,
      ),
    ).toBe(item);
  });

  it('changes nothing below the watched threshold', () => {
    const item = entry({position: 1000});
    expect(getUpNextItem(item, episode(4), episode(5), undefined, 2000)).toBe(
      item,
    );
  });

  it('leaves movies and the last episode in place', () => {
    const movie = entry({type: 'movie'});
    expect(getUpNextItem(movie, episode(4), episode(5), undefined, 2000)).toBe(
      movie,
    );
    const last = entry();
    expect(getUpNextItem(last, episode(4), undefined, undefined, 2000)).toBe(
      last,
    );
  });

  it('does nothing once the entry has moved on', () => {
    const next = getUpNextItem(
      entry(),
      episode(4),
      episode(5),
      undefined,
      2000,
    );
    expect(getUpNextItem(next, episode(4), episode(5), undefined, 3000)).toBe(
      next,
    );
  });

  it('is newer than the last save even when the clock is behind', () => {
    const next = getUpNextItem(entry(), episode(4), episode(5), undefined, 500);
    expect(next.updatedAt).toBe(1001);
  });
});

describe('getContinueWatchingRow', () => {
  it('hides watched movies and sorts the rest by last update', () => {
    const upNext = entry({
      id: 'up-next',
      position: 0,
      duration: 0,
      updatedAt: 3,
    });
    const halfway = entry({id: 'halfway', position: 600, updatedAt: 2});
    const watchedMovie = entry({id: 'movie', type: 'movie', updatedAt: 4});
    const noProvider = entry({id: 'old', providerValue: '', position: 0});
    const seasonEnd = entry({id: 'season-end', updatedAt: 1});

    expect(
      getContinueWatchingRow([
        halfway,
        watchedMovie,
        upNext,
        noProvider,
        seasonEnd,
      ]).map(item => item.id),
    ).toEqual(['up-next', 'halfway', 'season-end']);
  });
});

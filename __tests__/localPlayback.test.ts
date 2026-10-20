import {createLocalPlayback, getLocalContinueWatching, getLocalPlayerParams, getLocalResume} from '../src/lib/localContent/playback';
import type {LocalTitle} from '../src/lib/localContent/model';
import useLocalContentStore from '../src/lib/zustand/localContentStore';

jest.mock('../src/lib/storage/StorageService', () => ({
  createZustandStorage: () => ({getItem: () => null, setItem: jest.fn(), removeItem: jest.fn()}),
}));

const series = (): LocalTitle => ({
  id: 'show', name: 'Show', rootUri: 'root', folderUri: 'show', useMetadataTitles: true,
  metadata: {imdbId: 'tt123', title: 'Matched show', type: 'series', videos: [{season: 2, episode: 1, title: 'Return'}]},
  episodes: [
    {uri: 'content://one', name: 'S01E01.mkv', folder: 'Season 1', season: 1, episode: 1},
    {uri: 'content://two', name: 'S01E02.mkv', folder: 'Season 1', season: 1, episode: 2},
    {uri: 'content://three', name: 'S02E01.mkv', folder: 'Season 2', season: 2, episode: 1},
  ],
});

beforeEach(() => useLocalContentStore.setState({titles: []}));

it('persists local progress independently and retains it after a metadata edit', () => {
  const title = series();
  useLocalContentStore.getState().saveTitles([title]);
  useLocalContentStore.getState().savePlayback(title.id, 'content://two', 120, 1200);
  useLocalContentStore.getState().saveTitles([{...title, name: 'Renamed'}]);
  const saved = useLocalContentStore.getState().titles[0];
  expect(saved.playback).toMatchObject({episodeUri: 'content://two', position: 120, duration: 1200});
  expect(getLocalResume(saved)).toMatchObject({mode: 'resume', progress: 0.1, remainingSeconds: 1080});
  useLocalContentStore.getState().clearPlayback(title.id);
  expect(useLocalContentStore.getState().titles[0].playback).toBeUndefined();
  expect(useLocalContentStore.getState().titles[0].episodes).toHaveLength(3);
});

it('advances to the next season and opens the correct local file with metadata titles', () => {
  const title = series();
  title.playback = createLocalPlayback(title, 'content://two', 1190, 1200);
  const target = getLocalResume(title)!;
  expect(target).toMatchObject({mode: 'next', seasonTitle: 'Season 2', title: 'S2 E1 · Return'});
  expect(getLocalPlayerParams(title, target.episode.uri)).toMatchObject({
    localContent: true, providerValue: 'local', infoUrl: 'vega-local:show', linkIndex: 0,
    secondaryTitle: 'Season 2', episodeList: [{id: 'content://three', link: 'content://three', localFile: true}],
  });
});

it('uses previously cached progress and skips already completed episodes', () => {
  const title = series();
  expect(getLocalResume(title, uri => uri === 'content://one' ? {position: 30, duration: 100} : undefined))
    .toMatchObject({mode: 'resume', episode: {uri: 'content://one'}});
  title.playback = createLocalPlayback(title, 'content://one', 99, 100);
  expect(getLocalResume(title, uri => uri === 'content://two' ? {position: 99, duration: 100} : undefined))
    .toMatchObject({mode: 'next', episode: {uri: 'content://three'}});
});

it('hides finished movies and handles deleted files or invalid progress safely', () => {
  const movie = {...series(), metadata: {...series().metadata!, type: 'movie' as const}};
  movie.playback = createLocalPlayback(movie, 'content://one', 99, 100);
  expect(getLocalResume(movie)).toBeNull();
  expect(createLocalPlayback(movie, 'missing', 10, 100)).toBeUndefined();
  expect(createLocalPlayback(movie, 'content://one', NaN, 100)).toBeUndefined();
  expect(createLocalPlayback(movie, 'content://one', 1, 0)).toBeUndefined();
  expect(getLocalPlayerParams(movie, 'missing')).toBeNull();
  expect(getLocalResume({...series(), episodes: []})).toBeNull();
  expect(getLocalResume({...series(), playback: {episodeUri: 'deleted', position: 20, duration: 100, updatedAt: 1}}))
    .toMatchObject({mode: 'start', episode: {uri: 'content://one'}});
});

it('shows old cached progress without inventing recency and keeps removed entries hidden until replay', () => {
  const title = series();
  const read = (uri: string) => uri === 'content://one' ? {position: 30, duration: 100} : undefined;
  expect(getLocalContinueWatching(title, read)).toMatchObject({position: 30, updatedAt: 0});
  useLocalContentStore.getState().saveTitles([title]);
  useLocalContentStore.getState().clearPlayback(title.id);
  const cleared = useLocalContentStore.getState().titles[0];
  expect(getLocalContinueWatching(cleared, read)).toBeNull();
  expect(getLocalResume(cleared, read)).toMatchObject({mode: 'resume', position: 30});
  useLocalContentStore.getState().savePlayback(title.id, 'content://one', 40, 100);
  expect(getLocalContinueWatching(useLocalContentStore.getState().titles[0], read)).toMatchObject({position: 40});
});

import {
  getEpisodeLabel,
  parseEpisodeName,
  prepareLocalImport,
  scanEpisodes,
  type LocalEntry,
  type LocalTitle,
} from '../src/lib/localContent/model';

const dir = (uri: string, name: string): LocalEntry => ({
  uri,
  name,
  directory: true,
});
const file = (uri: string, name: string): LocalEntry => ({
  uri,
  name,
  directory: false,
});
const tree: Record<string, LocalEntry[]> = {
  root: [
    dir('show-b', 'Show B'),
    dir('show-a', 'Show A'),
    file('loose', 'Movie.mkv'),
    file('readme', 'readme.txt'),
  ],
  'show-a': [file('pilot', 'Pilot.mp4'), dir('season-1', 'Season 01')],
  'season-1': [
    file('ep10', 'Show.S01E10.mkv'),
    file('ep2', 'Show.S01E02.mkv'),
    dir('extras', 'Extras'),
    file('sub', 'sub.srt'),
  ],
  extras: [file('bonus', 'Behind the scenes.webm')],
  'show-b': [dir('season-b', 'S02')],
  'season-b': [file('b1', 'Episode 01.mp4')],
};
const list = jest.fn(async (uri: string) => tree[uri] || []);

beforeEach(() => list.mockClear());

it.each([
  ['Show.S01E02.1080p.mkv', '', {season: 1, episode: 2}],
  ['Show - 2x03.mkv', '', {season: 2, episode: 3}],
  ['Episode 04.mp4', 'Season 02', {season: 2, episode: 4}],
  ['E05.mkv', 'Season 03/Extras', {season: 3, episode: 5}],
  ['02 - Title.mkv', 'S01', {season: 1, episode: 2}],
  ['Movie.2024.1080p.mkv', '', {season: undefined, episode: undefined}],
])(
  'parses %s without interpreting years or resolutions as episodes',
  (name, folder, expected) => {
    expect(parseEpisodeName(name, folder)).toEqual(expected);
  },
);

it('keeps root files in Default, nested folders separate, and episodes naturally sorted', async () => {
  const episodes = await scanEpisodes('show-a', list);
  expect(episodes.map(e => [e.uri, e.folder])).toEqual([
    ['pilot', 'Default'],
    ['ep2', 'Season 01'],
    ['ep10', 'Season 01'],
    ['bonus', 'Season 01/Extras'],
  ]);
});

it('imports a parent folder into separate titles without duplicating children in its loose-file entry', async () => {
  const imported = await prepareLocalImport(
    {uri: 'root', name: 'TV'},
    true,
    list,
    [],
  );
  expect(imported.map(t => [t.name, t.episodes.map(e => e.uri)])).toEqual([
    ['TV', ['loose']],
    ['Show A', ['pilot', 'ep2', 'ep10', 'bonus']],
    ['Show B', ['b1']],
  ]);
  expect(imported.every(t => t.rootUri === 'root')).toBe(true);
});

it('imports a single series as one title and preserves its previous metadata and display choice', async () => {
  const previous: LocalTitle = {
    id: 'show-a',
    rootUri: 'root',
    folderUri: 'show-a',
    name: 'Show A',
    episodes: [],
    metadata: {imdbId: 'tt123', type: 'series', title: 'Matched show'},
    useMetadataTitles: false,
  };
  const imported = await prepareLocalImport(
    {uri: 'show-a', name: 'Show A'},
    false,
    list,
    [previous],
  );
  expect(imported).toHaveLength(1);
  expect(imported[0].metadata).toEqual(previous.metadata);
  expect(imported[0].useMetadataTitles).toBe(false);
  expect(imported[0].episodes).toHaveLength(4);
});

it('rescans loose files from a bulk parent without including its series folders', async () => {
  const [loose] = await prepareLocalImport(
    {uri: 'root', name: 'TV'},
    true,
    list,
    [],
  );
  expect(loose.rootFilesOnly).toBe(true);
  const episodes = await scanEpisodes(
    loose.folderUri,
    list,
    undefined,
    !loose.rootFilesOnly,
  );
  expect(episodes.map(e => e.uri)).toEqual(['loose']);
});

it('falls back to file names when numbering or metadata cannot match', () => {
  const title: LocalTitle = {
    id: 'show-a',
    rootUri: 'root',
    folderUri: 'show-a',
    name: 'Show A',
    episodes: [],
    useMetadataTitles: true,
    metadata: {
      imdbId: 'tt123',
      type: 'series',
      title: 'Show A',
      videos: [{season: 1, episode: 2, title: 'The second episode'}],
    },
  };
  const matched = {
    uri: 'ep2',
    name: 'Show.S01E02.mkv',
    folder: 'Season 01',
    season: 1,
    episode: 2,
  };
  expect(getEpisodeLabel(matched, title)).toBe('S1 E2 · The second episode');
  expect(getEpisodeLabel({...matched, episode: 3}, title)).toBe(matched.name);
  expect(getEpisodeLabel({...matched, season: undefined}, title)).toBe(
    matched.name,
  );
  expect(getEpisodeLabel(matched, {...title, useMetadataTitles: false})).toBe(
    matched.name,
  );
});

it('stops a cancelled scan and rejects inaccessible folders without saving a partial result', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(scanEpisodes('root', list, controller.signal)).rejects.toThrow(
    'cancelled',
  );
  expect(list).not.toHaveBeenCalled();
  await expect(
    scanEpisodes('root', async () => {
      throw new Error('Permission denied');
    }),
  ).rejects.toThrow('Permission denied');
});

it('labels matched movies as Movie only while metadata names are enabled', () => {
  const episode = {uri: 'movie', name: 'Movie.1080p.mkv', folder: 'Default'};
  const title: LocalTitle = {
    id: 'movie',
    rootUri: 'root',
    folderUri: 'root',
    name: 'Folder',
    episodes: [episode],
    useMetadataTitles: true,
    metadata: {imdbId: 'tt123', type: 'movie', title: 'Matched movie'},
  };
  expect(getEpisodeLabel(episode, title)).toBe('Movie');
  expect(getEpisodeLabel(episode, {...title, useMetadataTitles: false})).toBe(
    episode.name,
  );
  expect(getEpisodeLabel(episode, {...title, metadata: undefined})).toBe(
    episode.name,
  );
});

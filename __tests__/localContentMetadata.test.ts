import axios from 'axios';
import {fetchLocalMetadata} from '../src/lib/localContent/metadata';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeEach(() => jest.clearAllMocks());

it('fetches show metadata and keeps only episodes with usable season and episode numbers', async () => {
  mockedAxios.get.mockResolvedValueOnce({
    data: {
      meta: {
        name: 'Show',
        poster: 'https://poster',
        background: 'https://background',
        description: 'Synopsis',
        videos: [
          {
            season: 1,
            episode: 2,
            title: 'Episode title',
            overview: 'Episode description',
          },
          {season: 'one', episode: 3},
        ],
      },
    },
  });
  const result = await fetchLocalMetadata('tt123', 'series');
  expect(mockedAxios.get).toHaveBeenCalledWith(
    'https://v3-cinemeta.strem.io/meta/series/tt123.json',
    expect.objectContaining({timeout: 15000}),
  );
  expect(result).toEqual({
    imdbId: 'tt123',
    type: 'series',
    title: 'Show',
    poster: 'https://poster',
    background: 'https://background',
    description: 'Synopsis',
    videos: [
      {
        season: 1,
        episode: 2,
        title: 'Episode title',
        overview: 'Episode description',
      },
    ],
  });
});

it('rejects invalid IDs before making a request', async () => {
  await expect(
    fetchLocalMetadata('https://example.com', 'movie'),
  ).rejects.toThrow('IMDb ID');
  expect(mockedAxios.get).not.toHaveBeenCalled();
});

it('reports unavailable metadata so the import can continue without it', async () => {
  mockedAxios.get.mockResolvedValueOnce({data: {meta: null}});
  await expect(fetchLocalMetadata('tt123', 'movie')).rejects.toThrow(
    'No metadata',
  );
});

it('uses Cinemeta episode names when no title field is supplied', async () => {
  mockedAxios.get.mockResolvedValueOnce({
    data: {
      meta: {
        name: 'Mr. Robot',
        videos: [
          {
            season: 1,
            episode: 1,
            name: 'eps1.0_hellofriend.mov',
            overview: 'Full overview',
          },
        ],
      },
    },
  });
  const result = await fetchLocalMetadata('tt4158110', 'series');
  expect(result.videos?.[0]).toEqual({
    season: 1,
    episode: 1,
    title: 'eps1.0_hellofriend.mov',
    overview: 'Full overview',
  });
});

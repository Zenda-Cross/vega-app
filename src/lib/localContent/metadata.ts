import axios from 'axios';
import type {LocalMetadata} from './model';

export async function fetchLocalMetadata(
  imdbId: string,
  type: 'movie' | 'series',
  signal?: AbortSignal,
): Promise<LocalMetadata> {
  if (!/^tt\d+$/.test(imdbId))
    throw new Error('Enter an IMDb ID such as tt0944947');
  const {data} = await axios.get(
    `https://v3-cinemeta.strem.io/meta/${type}/${imdbId}.json`,
    {signal, timeout: 15000},
  );
  const meta = data?.meta;
  if (!meta || typeof meta.name !== 'string')
    throw new Error('No metadata found for this IMDb ID');
  return {
    imdbId,
    type,
    title: meta.name,
    logo: typeof meta.logo === 'string' ? meta.logo : undefined,
    genres: Array.isArray(meta.genres)
      ? meta.genres.filter((g: unknown) => typeof g === 'string')
      : undefined,
    rating: typeof meta.imdbRating === 'string' ? meta.imdbRating : undefined,
    runtime: typeof meta.runtime === 'string' ? meta.runtime : undefined,
    year:
      typeof meta.year === 'string'
        ? meta.year
        : typeof meta.releaseInfo === 'string'
          ? meta.releaseInfo
          : undefined,
    poster: typeof meta.poster === 'string' ? meta.poster : undefined,
    background:
      typeof meta.background === 'string' ? meta.background : undefined,
    description:
      typeof meta.description === 'string' ? meta.description : undefined,
    videos: Array.isArray(meta.videos)
      ? meta.videos
          .filter(
            (v: any) =>
              Number.isInteger(v.season) && Number.isInteger(v.episode),
          )
          .map((v: any) => ({
            season: v.season,
            episode: v.episode,
            title:
              typeof v.title === 'string'
                ? v.title
                : typeof v.name === 'string'
                  ? v.name
                  : undefined,
            overview: typeof v.overview === 'string' ? v.overview : undefined,
            thumbnail:
              typeof v.thumbnail === 'string' ? v.thumbnail : undefined,
          }))
      : [],
  };
}

import type {EpisodeLink} from './providers/types';
import type {ProviderMetadata} from './zustand/metadataOverrideStore';
import {parseEpisodeName} from './localContent/model';

export function applyProviderEpisodeMetadata<T extends EpisodeLink>(
  episode: T,
  seasonTitle: string,
  metadata?: ProviderMetadata,
): T {
  if (!metadata?.useEpisodeMetadata || metadata.type !== 'series')
    return episode;
  const seasonMatch =
    seasonTitle.match(/(?:^|[^a-z0-9])(?:season[ ._-]*|s)(\d{1,3})(?!\d)/i) ||
    seasonTitle.match(/^\s*(\d{1,3})\s*$/);
  const dropdownSeason = seasonMatch ? Number(seasonMatch[1]) : undefined;
  const parsed = parseEpisodeName(episode.title, seasonTitle);
  const season = parsed.season ?? dropdownSeason;
  const bareNumber = episode.title.match(/^\s*(\d{1,4})(?:\s*$|[ .:_-](?!\d))/);
  const number =
    parsed.episode ?? (bareNumber ? Number(bareNumber[1]) : undefined);
  if (
    season === undefined ||
    number === undefined ||
    (dropdownSeason !== undefined && dropdownSeason !== season)
  )
    return episode;
  // Fractional/split episodes must not be silently matched to an integer episode.
  if (/(?:e|episode\s*|ep\s*|^\s*)\d+\.\d{1,2}(?!\d)(?:\D|$)/i.test(episode.title))
    return episode;
  const matched = metadata.videos?.find(
    video => video.season === season && video.episode === number,
  );
  if (!matched) return episode;
  return {
    ...episode,
    title: matched.title?.trim()
      ? `S${season} E${number} · ${matched.title}`
      : episode.title,
    description: matched.overview?.trim() || episode.description,
    image: matched.thumbnail?.trim() || episode.image,
  };
}

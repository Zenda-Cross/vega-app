import {applyProviderEpisodeMetadata} from '../src/lib/providerEpisodeMetadata';
import type {ProviderMetadata} from '../src/lib/zustand/metadataOverrideStore';
const metadata: ProviderMetadata = {imdbId: 'tt123', type: 'series', title: 'Show', useEpisodeMetadata: true, videos: [{season: 2, episode: 3, title: 'Matched episode', overview: 'Full episode description', thumbnail: 'https://episode.jpg'}]};
const episode = {title: 'Episode 03', link: 'https://provider/episode', id: 'keep-id', quickDownload: true, description: 'Provider overview', image: 'https://provider.jpg'};
it.each([['Episode 03', 'Season 2'], ['Ep03', 'S02'], ['S02E03', 'Season 2'], ['Show.2x03.1080p.mkv', 'Season 2'], ['3', 'Season 2'], ['03 - Episode', '2'], ['Show.S02E03.mkv', 'Episodes'], ['Show.S02E03.1080p.mkv', 'Season 2']])('matches %s under %s', (title, season) => {
  const result = applyProviderEpisodeMetadata({...episode, title}, season, metadata);
  expect(result).toEqual({...episode, title: 'S2 E3 · Matched episode', description: 'Full episode description', image: 'https://episode.jpg'});
});
it.each([['Episode 04', 'Season 2'], ['Episode 03', 'Unknown season'], ['S01E03', 'Season 2'], ['Trailer', 'Season 2'], ['Episode 3.5', 'Season 2'], ['1080p', 'Season 2']])('keeps unmatched or ambiguous %s under %s', (title, season) => {
  const original = {...episode, title};
  expect(applyProviderEpisodeMetadata(original, season, metadata)).toBe(original);
});
it('is opt-in and does not remap movies', () => {
  expect(applyProviderEpisodeMetadata(episode, 'Season 2', {...metadata, useEpisodeMetadata: false})).toBe(episode);
  expect(applyProviderEpisodeMetadata(episode, 'Season 2', {...metadata, useEpisodeMetadata: undefined})).toBe(episode);
  expect(applyProviderEpisodeMetadata(episode, 'Season 2', {...metadata, type: 'movie'})).toBe(episode);
});
it('keeps provider details when the matched metadata fields are absent', () => {
  expect(applyProviderEpisodeMetadata(episode, 'Season 2', {...metadata, videos: [{season: 2, episode: 3}]})).toEqual(episode);
});

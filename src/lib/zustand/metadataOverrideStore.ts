import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {createZustandStorage} from '../storage/StorageService';
import type {LocalMetadata} from '../localContent/model';
import type {Info} from '../providers/types';

export interface ProviderMetadata extends LocalMetadata {
  useEpisodeMetadata?: boolean;
}

export const metadataOverrideKey = (provider: string, link: string) =>
  JSON.stringify([provider, link]);

export const applyMetadataOverride = (
  info: Info,
  metadata?: LocalMetadata,
): Info =>
  metadata
    ? {
        ...info,
        title: metadata.title,
        imdbId: metadata.imdbId,
        // Provider links and playback type remain the source for playback.
        image: metadata.background || metadata.poster || info.image,
        poster: metadata.poster || info.poster,
        logo: metadata.logo,
        synopsis: metadata.description || info.synopsis,
        rating: metadata.rating || info.rating,
        tmdbId: undefined,
      }
    : info;

interface MetadataOverrideState {
  overrides: Record<string, ProviderMetadata>;
  setMetadata: (
    provider: string,
    link: string,
    metadata?: ProviderMetadata,
  ) => void;
}

const useMetadataOverrideStore = create<MetadataOverrideState>()(
  persist(
    set => ({
      overrides: {},
      setMetadata: (provider, link, metadata) =>
        set(state => {
          const overrides = {...state.overrides};
          const key = metadataOverrideKey(provider, link);
          if (metadata) overrides[key] = metadata;
          else delete overrides[key];
          return {overrides};
        }),
    }),
    {
      name: 'provider-metadata-overrides-v1',
      storage: createJSONStorage(() => createZustandStorage()),
    },
  ),
);

export default useMetadataOverrideStore;

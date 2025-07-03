import {useQuery} from '@tanstack/react-query';
import {providerManager} from '../services/ProviderManager';
import {cacheStorage} from '../storage';
import {EpisodeLink} from '../providers/types';
import {extensionManager} from '../services';

export const useEpisodes = (
  episodesLink: string | undefined,
  providerValue: string,
  enabled: boolean = true,
) => {
  return useQuery<EpisodeLink[], Error>({
    queryKey: ['episodes', episodesLink, providerValue],
    queryFn: async () => {
      if (!episodesLink || !providerValue || !enabled) {
        return [];
      }

      console.log('Fetching episodes for:', episodesLink);

      // Check if provider has episodes module
      const hasEpisodesModule =
        extensionManager.getProviderModules(providerValue)?.modules.episodes;

      console.log('Has episodes module:', !!hasEpisodesModule);

      if (!hasEpisodesModule) {
        return [];
      }

      const episodes = await providerManager.getEpisodes({
        url: episodesLink,
        providerValue: providerValue,
      });

      // Cache successful responses
      if (episodes && episodes.length > 0) {
        cacheStorage.setString(episodesLink, JSON.stringify(episodes));
      }

      return episodes || [];
    },
    enabled: enabled && !!episodesLink && !!providerValue,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour (was cacheTime)
    retry: (failureCount, _error) => {
      // Don't retry on provider/network errors
      if (failureCount >= 2) {
        return false;
      }
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    // Use cached data as initial data
    initialData: () => {
      if (!episodesLink) {
        return undefined;
      }

      const cached = cacheStorage.getString(episodesLink);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return undefined;
        }
      }
      return undefined;
    },
    // Prevent background refetches unless data is stale
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: 'always',
  });
};

// Hook for managing streams for external player
export const useStreamData = () => {
  const fetchStreams = async (
    link: string,
    type: string,
    providerValue: string,
  ) => {
    const controller = new AbortController();

    try {
      const stream = await providerManager.getStream({
        link,
        type,
        signal: controller.signal,
        providerValue,
      });

      return stream || [];
    } catch (error) {
      console.error('Error fetching streams:', error);
      throw `Failed to fetch streams for ${type} at ${link} : ${error}`;
    }
  };

  return {fetchStreams};
};

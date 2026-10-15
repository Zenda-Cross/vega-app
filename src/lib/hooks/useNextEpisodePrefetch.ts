import {useCallback, useEffect, useRef} from 'react';
import {hashKey, useQueryClient} from '@tanstack/react-query';
import {
  fetchStreamList,
  getCompletedDownloadPathSync,
  getStreamQueryKey,
  streamQueryOptions,
} from './useStream';

/**
 * Seconds before the end of an episode when the next episode's servers load.
 * Late enough that the list is still fresh (5 minute stale time) after the
 * credits and the autoplay countdown, early enough for a slow provider.
 */
export const NEXT_EPISODE_PREFETCH_SECONDS = 3 * 60;

export const shouldPrefetchNextEpisode = ({
  currentTime,
  duration,
  nextEpisode,
  routeParams,
}: {
  currentTime: number;
  duration: number;
  nextEpisode: any;
  routeParams: any;
}): boolean => {
  if (!nextEpisode || routeParams?.type === 'movie') return false;
  // Imported files and videos opened from other apps have no servers.
  if (routeParams?.localContent || routeParams?.externalVideo) return false;
  if (
    !Number.isFinite(currentTime) ||
    !Number.isFinite(duration) ||
    duration <= 0 ||
    duration - currentTime > NEXT_EPISODE_PREFETCH_SECONDS
  ) {
    return false;
  }
  // A downloaded episode plays its file and loads servers only after that.
  return !getCompletedDownloadPathSync(nextEpisode, routeParams);
};

interface NextEpisodePrefetchOptions {
  activeEpisode: any;
  nextEpisode: any;
  routeParams: any;
  provider: string;
  /** False while the player does not load online servers for its episodes. */
  enabled: boolean;
}

/**
 * Loads the next episode's servers into the player's stream query shortly
 * before the current episode ends, so Next and autoplay start at once.
 * Returns a handler for playback progress.
 */
export const useNextEpisodePrefetch = (options: NextEpisodePrefetchOptions) => {
  const queryClient = useQueryClient();
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const requestedRef = useRef('');
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    return () => controller.abort();
  }, []);

  return useCallback(
    (currentTime: number, duration: number) => {
      const {nextEpisode, routeParams, provider, enabled} = optionsRef.current;
      const queryKey = getStreamQueryKey(nextEpisode, routeParams, provider);
      const key = hashKey(queryKey);
      const signal = controllerRef.current?.signal;
      if (
        !enabled ||
        !signal ||
        !queryKey[1] ||
        requestedRef.current === key ||
        !shouldPrefetchNextEpisode({
          currentTime,
          duration,
          nextEpisode,
          routeParams,
        })
      ) {
        return;
      }
      requestedRef.current = key;
      // No captcha over the playing video. Once the episode is open the player
      // waits on this request, so it may ask like the player's own would.
      const isOpen = () => {
        const current = optionsRef.current;
        const openKey = getStreamQueryKey(
          current.activeEpisode,
          current.routeParams,
          current.provider,
        );
        return hashKey(openKey) === key;
      };
      // Settles without throwing and skips an episode whose list is fresh. A
      // failure leaves no data, so opening the episode fetches it normally.
      queryClient.prefetchQuery({
        queryKey,
        queryFn: () =>
          fetchStreamList({
            episode: nextEpisode,
            routeParams,
            provider,
            signal,
            canPromptWaf: isOpen,
          }),
        ...streamQueryOptions,
        // A closed player has nothing to retry for.
        retry: (failureCount, error) =>
          !signal.aborted && streamQueryOptions.retry(failureCount, error),
      });
    },
    [queryClient],
  );
};

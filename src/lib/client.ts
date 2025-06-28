import {QueryClient} from '@tanstack/react-query';

// Enhanced query client with optimal configurations
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on abort errors or 4xx errors
        if (error.name === 'AbortError') {
          return false;
        }
        if (error.message?.includes('4')) {
          return false; // 4xx errors
        }

        // Retry up to 3 times for other errors with exponential backoff
        return failureCount < 3;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Cache configuration
      staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh for 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for 30 minutes

      // Network configuration
      refetchOnWindowFocus: false, // Don't refetch when app regains focus
      refetchOnReconnect: 'always', // Always refetch when reconnected
      refetchOnMount: true, // Refetch when component mounts

      // Performance optimizations
      refetchInterval: false, // Disable automatic polling by default
      notifyOnChangeProps: 'all', // Only notify on tracked properties

      // Error handling
      throwOnError: false, // Don't throw errors, handle them in components

      // Network mode - continue with cached data if offline
      networkMode: 'online',
    },
    mutations: {
      retry: 1, // Retry mutations once
      retryDelay: 1000,
      throwOnError: false,
      networkMode: 'online',
    },
  },
});

// Enhanced query client for development with additional logging
export const createDevQueryClient = () => {
  const client = new QueryClient({
    defaultOptions: queryClient.getDefaultOptions(),
  });

  // Add development-only event listeners
  if (__DEV__) {
    client.getQueryCache().subscribe(event => {
      console.log('Query cache event:', event.type, event.query.queryKey);
    });

    client.getMutationCache().subscribe(event => {
      console.log(
        'Mutation cache event:',
        event.type,
        event?.mutation?.options?.mutationKey,
      );
    });
  }

  return client;
};

// Performance monitoring utilities
export const queryClientUtils = {
  // Get cache statistics
  getCacheStats: () => {
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();

    return {
      totalQueries: queries.length,
      freshQueries: queries.filter(q => q.isStale() === false).length,
      staleQueries: queries.filter(q => q.isStale() === true).length,
      loadingQueries: queries.filter(q => q.state.fetchStatus === 'fetching')
        .length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
    };
  },

  // Clear specific cache patterns
  clearCache: (patterns: string[]) => {
    patterns.forEach(pattern => {
      queryClient.removeQueries({queryKey: [pattern]});
    });
  },

  // Prefetch common queries
  prefetchCommonData: async (providerValue: string) => {
    // Prefetch catalog data
    await queryClient.prefetchQuery({
      queryKey: ['catalog', providerValue],
      queryFn: async () => {
        const {providerManager} = await import('./services/ProviderManager');
        return providerManager.getCatalog({providerValue});
      },
      staleTime: 10 * 60 * 1000, // 10 minutes
    });
  },

  // Optimistic updates helper
  setOptimisticData: <T>(
    queryKey: unknown[],
    updater: (old: T | undefined) => T,
  ) => {
    queryClient.setQueryData(queryKey, updater);
  },
};

// Export the appropriate client based on environment
export const client = __DEV__ ? createDevQueryClient() : queryClient;

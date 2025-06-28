import {Content} from './zustand/contentStore';
import {Post} from './providers/types';
import {providerManager} from './services/ProviderManager';

export interface HomePageData {
  title: string;
  Posts: Post[];
  filter: string;
  error?: string;
}

// Optimized version with better error handling
export const getHomePageDataOptimized = async (
  activeProvider: Content['provider'],
  signal: AbortSignal,
): Promise<HomePageData[]> => {
  console.log('Fetching data for provider:', activeProvider.display_name);

  const catalogs = providerManager.getCatalog({
    providerValue: activeProvider.value,
  });

  // Use Promise.allSettled for partial success
  const fetchPromises = catalogs.map(async item => {
    try {
      const data = await providerManager.getPosts({
        filter: item.filter,
        page: 1,
        providerValue: activeProvider.value,
        signal,
      });

      if (signal.aborted) {
        throw new Error('Request aborted');
      }

      console.log(`✅ Fetched ${data?.length || 0} posts for: ${item.title}`);

      return {
        title: item.title,
        Posts: data || [],
        filter: item.filter,
      };
    } catch (error) {
      console.error(`❌ Failed to fetch ${item.title}:`, error);

      // Return partial data with error info instead of failing completely
      return {
        title: item.title,
        Posts: [],
        filter: item.filter,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  const results = await Promise.allSettled(fetchPromises);

  // Extract successful results and log failures
  const homePageData: HomePageData[] = [];
  let successCount = 0;
  let failureCount = 0;

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      homePageData.push(result.value);
      if (result.value.Posts.length > 0) {
        successCount++;
      }
    } else {
      failureCount++;
      console.error(
        `Failed to process catalog ${catalogs[index].title}:`,
        result.reason,
      );

      // Add empty category to maintain layout
      homePageData.push({
        title: catalogs[index].title,
        Posts: [],
        filter: catalogs[index].filter,
        error: result.reason?.message || 'Failed to load',
      });
    }
  });

  console.log(
    `📊 Results: ${successCount} successful, ${failureCount} failed categories`,
  );

  // Ensure we have at least some data
  if (successCount === 0) {
    throw new Error('Failed to load any content categories');
  }

  return homePageData;
};

// Keep original for backward compatibility
export const getHomePageData = getHomePageDataOptimized;

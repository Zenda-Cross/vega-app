import {Content} from './zustand/contentStore';
import {Post} from './providers/types';
import {providerManager} from './services/ProviderManager';

export interface HomePageData {
  title: string;
  Posts: Post[];
  filter: string;
}

export const getHomePageData = async (
  activeProvider: Content['provider'],
  signal: AbortSignal,
): Promise<HomePageData[]> => {
  console.log('activeProvider', activeProvider);

  const fetchPromises = providerManager
    .getCatalog({providerValue: activeProvider.value})
    .map(async item => {
      const data = await providerManager.getPosts({
        filter: item.filter,
        page: 1,
        providerValue: activeProvider.value,
        signal,
      });
      return {
        title: item.title,
        Posts: data?.length > 0 ? data : [],
        filter: item.filter,
      };
    });

  return Promise.all(fetchPromises);
};

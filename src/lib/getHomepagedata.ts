import {Content} from './zustand/contentStore';
import {manifest} from './Manifest';
import {Post} from './providers/types';
import {providerContext} from './providers/providerContext';

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

  const fetchPromises = manifest[activeProvider.value].catalog.map(
    async item => {
      const data = await manifest[activeProvider.value].GetHomePosts({
        filter: item.filter,
        page: 1,
        providerValue: activeProvider.value,
        signal,
        providerContext: providerContext,
      });
      return {
        title: item.title,
        Posts: data?.length > 0 ? data : [],
        filter: item.filter,
      };
    },
  );

  return Promise.all(fetchPromises);
};

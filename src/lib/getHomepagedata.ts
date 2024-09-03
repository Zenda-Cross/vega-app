import {Content} from './zustand/contentStore';
import {manifest} from './Manifest';
import {Post} from './providers/types';

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
      const data = await manifest[activeProvider.value].GetHomePosts(
        item.filter,
        1,
        activeProvider.value,
        signal,
      );
      return {
        title: item.title,
        Posts: data,
        filter: item.filter,
      };
    },
  );

  return Promise.all(fetchPromises);
};

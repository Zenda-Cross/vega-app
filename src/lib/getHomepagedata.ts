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
  const homeData: HomePageData[] = [];
  console.log('activeProvider', activeProvider);
  for (const item of manifest[activeProvider.value].catalog) {
    const data = await manifest[activeProvider.value].getPosts(
      item.filter,
      1,
      activeProvider.value,
      signal,
    );
    homeData.push({
      title: item.title,
      Posts: data,
      filter: item.filter,
    });
  }
  return homeData;
};

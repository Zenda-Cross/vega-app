import {manifest} from './Manifest';
import {providersList} from './constants';

export interface Post {
  title: string;
  link: string;
  image: string;
}

export interface SearchPageData {
  title: string;
  Posts: Post[];
  filter: string;
  providerValue: string;
}
export const getSearchResults = async (
  filter: string,
  signal: AbortSignal,
): Promise<SearchPageData[]> => {
  const SearchData: SearchPageData[] = [];
  for (const item of providersList) {
    const data = await manifest[item.value].getPosts(filter, 1, item, signal);
    SearchData.push({
      title: item.name,
      Posts: data,
      filter: filter,
      providerValue: item.value,
    });
  }
  return SearchData;
};

import {manifest} from './Manifest';
import {providersList} from './constants';
import {MMKV} from './Mmkv';

const disabledProviders = MMKV.getArray('disabledProviders') || [];

const updatedProvidersList = providersList.filter(
  provider => !disabledProviders.includes(provider.value),
);

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
  console.log('updatedProvidersList', updatedProvidersList, disabledProviders);

  for (const item of updatedProvidersList) {
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

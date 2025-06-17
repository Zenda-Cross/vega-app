import {Post, ProviderContext} from '../types';

export const flixhqGetPosts = async function ({
  filter,
  signal,
  providerContext,
}: {
  filter: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  const {getBaseUrl} = providerContext;
  const urlRes = await getBaseUrl('consumet');
  const baseUrl = urlRes + '/movies/flixhq';
  const url = `${baseUrl + filter}`;
  return posts({url, signal, providerContext});
};

export const flixhqGetSearchPost = async function ({
  searchQuery,
  page,
  signal,
  providerContext,
}: {
  searchQuery: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  const {getBaseUrl} = providerContext;
  const urlRes = await getBaseUrl('consumet');
  const baseUrl = urlRes + '/movies/flixhq';
  const url = `${baseUrl}/${searchQuery}?page=${page}`;
  return posts({url, signal, providerContext});
};

async function posts({
  url,
  signal,
  providerContext,
}: {
  url: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  try {
    const {axios} = providerContext;
    const res = await axios.get(url, {signal});
    const data = res.data?.results || res.data;
    const catalog: Post[] = [];
    data?.map((element: any) => {
      const title = element.title;
      const link = element.id;
      const image = element.image;
      if (title && link && image) {
        catalog.push({
          title: title,
          link: link,
          image: image,
        });
      }
    });
    return catalog;
  } catch (err) {
    console.error('flixhq error ', err);
    return [];
  }
}

import {Post, ProviderContext} from '../types';

export const hiGetPosts = async function ({
  filter,
  page,
  signal,
  providerContext,
}: {
  filter: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  const {getBaseUrl, axios} = providerContext;
  const baseUrl = await getBaseUrl('consumet');
  const url = `${baseUrl + filter}?page=${page}`;
  return posts({url, signal, axios});
};

export const hiGetPostsSearch = async function ({
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
  const {getBaseUrl, axios} = providerContext;
  const baseUrl = await getBaseUrl('consumet');
  const url = `${baseUrl}/anime/zoro/${searchQuery}?page=${page}`;
  return posts({url, signal, axios});
};

async function posts({
  url,
  signal,
  axios,
}: {
  url: string;
  signal: AbortSignal;
  axios: ProviderContext['axios'];
}): Promise<Post[]> {
  try {
    const res = await axios.get(url, {signal});
    const data = res.data?.results;
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
    console.error('zoro error ', err);
    return [];
  }
}

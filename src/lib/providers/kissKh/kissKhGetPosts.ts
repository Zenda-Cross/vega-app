import {Post, ProviderContext} from '../types';

export const kissKhGetPosts = async function ({
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
  const {getBaseUrl, axios} = providerContext;
  const baseUrl = await getBaseUrl('kissKh');
  const url = `${baseUrl + filter}&type=0`;
  try {
    const res = await axios.get(url, {signal});
    const data = res.data?.data;
    const catalog: Post[] = [];
    data?.map((element: any) => {
      const title = element.title;
      const link = baseUrl + `/api/DramaList/Drama/${element?.id}?isq=false`;
      const image = element.thumbnail;
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
    console.error('kiss error ', err);
    return [];
  }
};

export const kissKhGetPostsSearch = async function ({
  searchQuery,
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
  const baseUrl = await getBaseUrl('kissKh');
  const url = `${baseUrl}/api/DramaList/Search?q=${searchQuery}&type=0`;
  try {
    const res = await axios.get(url, {signal});
    const data = res.data;
    const catalog: Post[] = [];
    data?.map((element: any) => {
      const title = element.title;
      const link = baseUrl + `/api/DramaList/Drama/${element?.id}?isq=false`;
      const image = element.thumbnail;
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
    console.error('kiss error ', err);
    return [];
  }
};

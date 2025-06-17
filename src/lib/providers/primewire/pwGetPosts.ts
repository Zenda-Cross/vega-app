import {Post, ProviderContext} from '../types';

export const pwGetPosts = async function ({
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
  const {getBaseUrl, axios, cheerio} = providerContext;

  const baseUrl = await getBaseUrl('primewire');
  const url = `${baseUrl + filter}&page=${page}`;
  return posts({baseUrl, url, signal, axios, cheerio});
};

export const pwGetPostsSearch = async function ({
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
  const {getBaseUrl, axios, cheerio, Aes} = providerContext;
  const getSHA256ofJSON = async function (input: any) {
    return await Aes.sha1(input);
  };
  const baseUrl = await getBaseUrl('primewire');
  const hash = await getSHA256ofJSON(searchQuery + 'JyjId97F9PVqUPuMO0');
  const url = `${baseUrl}/filter?s=${searchQuery}&page=${page}&ds=${hash.slice(
    0,
    10,
  )}`;
  return posts({baseUrl, url, signal, axios, cheerio});
};

async function posts({
  baseUrl,
  url,
  signal,
  axios,
  cheerio,
}: {
  baseUrl: string;
  url: string;
  signal: AbortSignal;
  axios: ProviderContext['axios'];
  cheerio: ProviderContext['cheerio'];
}): Promise<Post[]> {
  try {
    const res = await axios.get(url, {signal});
    const data = res.data;
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.index_item.index_item_ie').map((i, element) => {
      const title = $(element).find('a').attr('title');
      const link = $(element).find('a').attr('href');
      const image = $(element).find('img').attr('src') || '';
      if (title && link) {
        catalog.push({
          title: title,
          link: baseUrl + link,
          image: image,
        });
      }
    });
    return catalog;
  } catch (err) {
    console.error('primewire error ', err);
    return [];
  }
}

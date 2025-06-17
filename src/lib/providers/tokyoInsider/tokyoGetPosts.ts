import {Post, ProviderContext} from '../types';

export const tokyoGetPosts = async function ({
  filter,
  page,
  // providerValue,
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
  const baseURL = await getBaseUrl('tokyoinsider');
  const start = page < 2 ? 0 : (page - 1) * 20;
  const url = `${baseURL}/${filter}&start=${start}`;
  return posts({baseURL, url, signal, axios, cheerio});
};

export const tokyoGetPostsSearch = async function ({
  searchQuery,
  page,
  // providerValue,
  signal,
  providerContext,
}: {
  searchQuery: string;
  page: number;
  providerValue: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  const {getBaseUrl, axios, cheerio} = providerContext;
  const baseURL = await getBaseUrl('tokyoinsider');
  const start = page < 2 ? 0 : (page - 1) * 20;
  const url = `${baseURL}/anime/search?k=${searchQuery}&start=${start}`;
  return posts({baseURL, url, signal, axios, cheerio});
};

async function posts({
  baseURL,
  url,
  signal,
  axios,
  cheerio,
}: {
  baseURL: string;
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
    $('td.c_h2[width="40"]').map((i, element) => {
      const image = $(element)
        .find('.a_img')
        .attr('src')
        ?.replace('small', 'default');
      const title = $(element).find('a').attr('title');
      const link = baseURL + $(element).find('a').attr('href');
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
    return [];
  }
}

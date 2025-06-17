import {Post, ProviderContext} from '../types';

export const sbGetPosts = async function ({
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
  const baseUrl = await getBaseUrl('showbox');
  const url = `${baseUrl + filter}?page=${page}/`;
  return posts({url, signal, baseUrl, axios, cheerio});
};

export const sbGetPostsSearch = async function ({
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
  const baseUrl = await getBaseUrl('showbox');
  const url = `${baseUrl}/search?keyword=${searchQuery}&page=${page}`;
  return posts({url, signal, baseUrl, axios, cheerio});
};

async function posts({
  url,
  signal,
  // baseUrl,
  axios,
  cheerio,
}: {
  url: string;
  signal: AbortSignal;
  baseUrl: string;
  axios: ProviderContext['axios'];
  cheerio: ProviderContext['cheerio'];
}): Promise<Post[]> {
  try {
    const res = await axios.get(url, {signal});
    const data = res.data;
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.movie-item').map((i, element) => {
      const title = $(element).find('.movie-title').text();
      const link = $(element).find('a').attr('href');
      const image = $(element).find('img').attr('src');
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

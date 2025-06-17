import {Post, ProviderContext} from '../types';

export const modGetPosts = async function ({
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
  const baseUrl = await getBaseUrl('Moviesmod');
  const url = `${baseUrl + filter}/page/${page}/`;
  return posts({url, signal, axios, cheerio});
};

export const modGetPostsSearch = async function ({
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
  const {getBaseUrl, axios, cheerio} = providerContext;
  const baseUrl = await getBaseUrl('Moviesmod');
  const url = `${baseUrl}/search/${searchQuery}/page/${page}/`;
  return posts({url, signal, axios, cheerio});
};

async function posts({
  url,
  signal,
  axios,
  cheerio,
}: {
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
    $('.post-cards')
      .find('article')
      .map((i, element) => {
        const title = $(element).find('a').attr('title');
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
    console.error('modGetPosts error ', err);
    return [];
  }
}

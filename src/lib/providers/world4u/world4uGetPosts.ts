import {Post, ProviderContext} from '../types';

export const world4uGetPosts = async function ({
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
  const baseUrl = await getBaseUrl('w4u');
  const url = `${baseUrl + filter}/page/${page}/`;
  return posts({url, signal, axios, cheerio});
};

export const world4uGetPostsSearch = async function ({
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
  const baseUrl = await getBaseUrl('w4u');
  const url = `${baseUrl}/page/${page}/?s=${searchQuery}`;
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
    $('.recent-posts')
      .children()
      .map((i, element) => {
        const title = $(element).find('.post-thumb').find('a').attr('title');
        const link = $(element).find('.post-thumb').find('a').attr('href');
        const image =
          $(element).find('.post-thumb').find('img').attr('data-src') ||
          $(element).find('.post-thumb').find('img').attr('src');
        if (title && link && image) {
          catalog.push({
            title: title.replace('Download', '').trim(),
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

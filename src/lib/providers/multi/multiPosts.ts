import {Post, ProviderContext} from '../types';

export const multiGetPosts = async function ({
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
  const {getBaseUrl, cheerio} = providerContext;
  const baseUrl = await getBaseUrl('multi');
  const url = `${baseUrl + filter}page/${page}/`;
  return posts({url, signal, cheerio});
};

export const multiGetPostsSearch = async function ({
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
  const {getBaseUrl, cheerio} = providerContext;
  const baseUrl = await getBaseUrl('multi');
  const url = `${baseUrl}/?s=${searchQuery}`;
  return posts({url, signal, cheerio});
};

async function posts({
  url,
  signal,
  cheerio,
}: {
  url: string;
  signal: AbortSignal;
  cheerio: ProviderContext['cheerio'];
}): Promise<Post[]> {
  try {
    const res = await fetch(url, {signal});
    const data = await res.text();
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.items.full')
      .children()
      .map((i, element) => {
        const title = $(element).find('.poster').find('img').attr('alt');
        const link = $(element).find('.poster').find('a').attr('href');
        const image =
          $(element).find('.poster').find('img').attr('data-src') ||
          $(element).find('.poster').find('img').attr('src');
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
    console.error('multiGetPosts error ', err);
    return [];
  }
}

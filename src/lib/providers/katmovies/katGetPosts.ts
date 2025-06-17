import {Post, ProviderContext} from '../types';

export const katGetPosts = async function ({
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
  const baseUrl = await getBaseUrl('kat');
  const url = `${baseUrl + filter}/page/${page}/`;
  return posts({url, signal, cheerio});
};

export const katGetPostsSearch = async function ({
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
  const {getBaseUrl, cheerio} = providerContext;
  const baseUrl = await getBaseUrl('kat');
  const url = `${baseUrl}/page/${page}/?s=${searchQuery}`;
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
    $('.recent-posts')
      .children()
      .map((i, element) => {
        const title = $(element).find('img').attr('alt');
        const link = $(element).find('a').attr('href');
        const image = $(element).find('img').attr('src');
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
    console.error('katmovies error ', err);
    return [];
  }
}

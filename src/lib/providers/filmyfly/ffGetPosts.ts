import {Post, ProviderContext} from '../types';

export const ffGetPosts = async function ({
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
  const {getBaseUrl} = providerContext;
  const baseUrl = await getBaseUrl('filmyfly');
  const url = `${baseUrl + filter}/${page}`;
  return posts({url, signal, baseUrl, providerContext});
};

export const ffGetPostsSearch = async function ({
  searchQuery,
  page,
  signal,
  providerContext,
}: {
  searchQuery: string;
  page: number;
  providerValue: string;
  providerContext: ProviderContext;
  signal: AbortSignal;
}): Promise<Post[]> {
  const {getBaseUrl} = providerContext;
  const baseUrl = await getBaseUrl('filmyfly');
  const url = `${baseUrl}/site-1.html?to-search=${searchQuery}`;
  if (page > 1) {
    return [];
  }
  return posts({url, signal, baseUrl, providerContext});
};

async function posts({
  url,
  signal,
  baseUrl,
  providerContext,
}: {
  url: string;
  signal: AbortSignal;
  baseUrl: string;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  try {
    const {cheerio, commonHeaders: headers} = providerContext;
    const res = await fetch(url, {headers, signal});
    const data = await res.text();
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.A2,.A10,.fl').map((i, element) => {
      const title =
        $(element).find('a').eq(1).text() || $(element).find('b').text();
      const link = $(element).find('a').attr('href');
      const image = $(element).find('img').attr('src');
      if (title && link && image) {
        catalog.push({
          title: title,
          link: baseUrl + link,
          image: image,
        });
      }
    });
    return catalog;
  } catch (err) {
    console.error('ff error ', err);
    return [];
  }
}

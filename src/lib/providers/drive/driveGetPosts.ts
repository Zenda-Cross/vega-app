import {Post, ProviderContext} from '../types';

export const driveGetPosts = async function ({
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
  const baseUrl = await getBaseUrl('drive');
  const url = `${baseUrl + filter}/page/${page}/`;
  return posts({url, signal, providerContext});
};

export const driveGetSearchPost = async function ({
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
  const baseUrl = await getBaseUrl('drive');
  const url = `${baseUrl}page/${page}/?s=${searchQuery}`;
  return posts({url, signal, providerContext});
};

async function posts({
  url,
  signal,
  providerContext,
}: {
  url: string;
  signal: AbortSignal;
  providerContext: ProviderContext;
}): Promise<Post[]> {
  try {
    const {cheerio} = providerContext;
    const res = await fetch(url, {signal});
    const data = await res.text();
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.recent-movies')
      .children()
      .map((i, element) => {
        const title = $(element).find('figure').find('img').attr('alt');
        const link = $(element).find('a').attr('href');
        const image = $(element).find('figure').find('img').attr('src');
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
    console.error('drive error ', err);
    return [];
  }
}

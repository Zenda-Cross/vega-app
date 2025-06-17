import {Post, ProviderContext} from '../types';

const headers = {
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Cache-Control': 'no-store',
  'Accept-Language': 'en-US,en;q=0.9',
  DNT: '1',
  'sec-ch-ua':
    '"Not_A Brand";v="8", "Chromium";v="120", "Microsoft Edge";v="120"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
};

export const uhdGetPosts = async ({
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
}): Promise<Post[]> => {
  const {getBaseUrl} = providerContext;
  const baseUrl = await getBaseUrl('UhdMovies');
  const url =
    page === 1 ? `${baseUrl}/${filter}/` : `${baseUrl + filter}/page/${page}/`;
  console.log('url', url);

  return posts(baseUrl, url, signal, providerContext);
};

export const uhdGetPostsSearch = async ({
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
}): Promise<Post[]> => {
  const {getBaseUrl} = providerContext;
  const baseUrl = await getBaseUrl('UhdMovies');
  const url = `${baseUrl}/search/${searchQuery}/page/${page}/`;

  return posts(baseUrl, url, signal, providerContext);
};

async function posts(
  baseURL: string,
  url: string,
  signal: AbortSignal,
  providerContext: ProviderContext,
): Promise<Post[]> {
  try {
    const {axios, cheerio} = providerContext;
    const res = await axios.get(url, {headers, signal});
    const html = res.data;
    const $ = cheerio.load(html);
    const uhdCatalog: Post[] = [];

    $('.gridlove-posts')
      .find('.layout-masonry')
      .each((index, element) => {
        const title = $(element).find('a').attr('title');
        const link = $(element).find('a').attr('href');
        const image = $(element).find('a').find('img').attr('src');

        if (title && link && image) {
          uhdCatalog.push({
            title: title.replace('Download', '').trim(),
            link: link,
            image: image,
          });
        }
      });
    return uhdCatalog;
  } catch (err) {
    console.error('uhd error ', err);
    return [];
  }
}

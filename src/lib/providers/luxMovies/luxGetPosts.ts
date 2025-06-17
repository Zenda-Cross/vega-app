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
  Cookie:
    'ext_name=ojplmecpdpgccookcobabopnaifgidhf; cf_clearance=gaIhTNzqSvp27JCVf7qiEUfYRfwyj0Jx9rcsn774BbE-1732694853-1.2.1.1-QKgYJvmrEz08gM9qbAp70diztE2.hseO2NNi.0imIUk_gkuWUcr7U8t5Zn_z4Ov30sIGPBES1PBgMUEa.s8e8QTkQoZjgziFmoC7YdX7s2Jnt.tYCxE_s5mMLQQBYbz_94A89IYe93Y6kyLQm_L.dvUKPPiGjn_sH3qRD0g4p9oOl0SPvH0T2W_EaD0r6mVBasbgro9dAROt_6CxshXOEGeMOnoWR.ID699FKldjMUhbXJbATAffdOY6kf2sD_iwrSl4bcetTlDHd4gusTVfxSS1pL5qNjyTU9wa38soPl1wZoqFHkEGOPWz6S7FD5ikHxX0bArFem9hiDeJXctYfWz5e_Lkc6lH7nW0Rm2XS3gxCadQSg21RkSReN6kDAEecqjgJSE4zUomkWAxFZ98TSShgGWC0ridPTpdQizPDZQ; _lscache_vary=c1d682536aea2d88fbb2574666e1f0aa',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
};

export const luxGetPosts = async ({
  filter,
  page,
  providerValue,
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
  const baseUrl = await getBaseUrl('lux');

  console.log('vegaGetPosts baseUrl:', providerValue, baseUrl);
  const url = `${baseUrl}/${filter}/page/${page}/`;
  console.log('lux url:', url);
  return posts(url, signal, providerContext);
};

export const luxGetPostsSearch = async ({
  searchQuery,
  page,
  providerValue,
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
  const baseUrl = await getBaseUrl('lux');

  console.log('vegaGetPosts baseUrl:', providerValue, baseUrl);
  const url = `${baseUrl}/page/${page}/?s=${searchQuery}`;
  console.log('lux url:', url);

  return posts(url, signal, providerContext);
};

async function posts(
  url: string,
  signal: AbortSignal,
  providerContext: ProviderContext,
): Promise<Post[]> {
  try {
    const {axios, cheerio} = providerContext;
    const urlRes = await axios.get(url, {headers, signal});
    const $ = cheerio.load(urlRes.data);
    const posts: Post[] = [];
    $('.blog-items')
      ?.children('article')
      ?.each((index, element) => {
        const post = {
          title:
            $(element)
              ?.find('a')
              ?.attr('title')
              ?.replace('Download', '')
              ?.match(/^(.*?)\s*\((\d{4})\)|^(.*?)\s*\((Season \d+)\)/)?.[0] ||
            $(element)?.find('a')?.attr('title')?.replace('Download', '') ||
            '',

          link: $(element)?.find('a')?.attr('href') || '',
          image:
            $(element).find('a').find('img').attr('data-lazy-src') ||
            $(element).find('a').find('img').attr('data-src') ||
            $(element).find('a').find('img').attr('src') ||
            '',
        };
        if (post.image.startsWith('//')) {
          post.image = 'https:' + post.image;
        }
        posts.push(post);
      });

    // console.log(posts);
    return posts;
  } catch (error) {
    console.error('vegaGetPosts error:', error);
    return [];
  }
}

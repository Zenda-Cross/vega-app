import axios from 'axios';
import * as cheerio from 'cheerio';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

const sbHeaders = {
  accept: '*/*',
  'accept-language': 'en-US,en;q=0.9,en-IN;q=0.8',
  'cache-control': 'no-cache',
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  pragma: 'no-cache',
  priority: 'u=1, i',
  'sec-ch-ua':
    '"Chromium";v="134", "Not:A-Brand";v="24", "Microsoft Edge";v="134"',
  'sec-ch-ua-arch': '"x86"',
  'sec-ch-ua-bitness': '"64"',
  'sec-ch-ua-full-version': '"134.0.3124.83"',
  'sec-ch-ua-full-version-list':
    '"Chromium";v="134.0.6998.118", "Not:A-Brand";v="24.0.0.0", "Microsoft Edge";v="134.0.3124.83"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-model': '""',
  'sec-ch-ua-platform': '"Windows"',
  'sec-ch-ua-platform-version': '"19.0.0"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-origin',
  'x-requested-with': 'XMLHttpRequest',
  cookie:
    'ext_name=ojplmecpdpgccookcobabopnaifgidhf; ci=167dea138333aa; cf_clearance=F3Z5jQdACVu5drghUljgmK3dhdEOZYzsniaa0NdJVNA-1742648415-1.2.1.1-d.Ca2P0QkU14cC0m2vtrvJVSBuwxHAt97GLurkp77PhO8ds7ttvUi4rT70ynq0B0shpfbnBRT0G767aiVcn3K4Pee2kOH_mhpcZQsaba8XYDtv40uA1bOW5H0Ec3rW_ZVI8OHbcc8LOTAEinRFMrUQx1ndtX774eZ4SiDFDofRSJ.UClV22dKqe1qRxAPlBXUl2we9ZaVt3YUFebfaRSup1eqZ8OLDP05X2X3CDk5QBMlPbSgU.cLyJYevWBbcsAh3Jo8UnMBghAcSGwhHeq.bgL4SfK4qLBej9rh7FdTxksN0MsovGgucUNyud_sOrLWMZ.uLlgUAApoXrYR.5PwJODNEFesP9rDXNxwR3PcMc',
  Referer:
    'https://www.showbox.media/movie/m-captain-america-brave-new-world-2024',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export const sbGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('showbox');
  const url = `${baseUrl + filter}?page=${page}/`;
  console.log('sbGetPosts', url);

  return posts(url, signal, baseUrl);
};

export const sbGetPostsSearch = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('showbox');
  const url = `${baseUrl}/search?keyword=${searchQuery}&page=${page}`;
  return posts(url, signal, baseUrl);
};

async function posts(
  url: string,
  signal: AbortSignal,
  baseUrl: string,
): Promise<Post[]> {
  try {
    const res = await axios.get(url, {headers: sbHeaders, signal});
    const data = res.data;
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.flw-item').map((i, element) => {
      const title = $(element).find('.film-name').text();
      const link = $(element).find('.film-name').find('a').attr('href');
      const image = $(element).find('.film-poster-img').attr('src') || '';
      // console.log('image', title, link);
      if (title && link) {
        catalog.push({
          title: title.trim(),
          link: link?.startsWith('http') ? link : `${baseUrl}${link}`,
          image: image?.startsWith('http') ? image : `${baseUrl}${image}`,
        });
      }
    });
    // console.log(catalog);
    return catalog;
  } catch (err) {
    console.error('sb error ', err);
    return [];
  }
}

import axios from 'axios';
import * as cheerio from 'cheerio';
import {getNfHeaders} from './nfHeaders';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';
import {nfGetCookie} from './nfGetCookie';

export const nfGetPost = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const baseUrl = await getBaseUrl('nfMirror');
    const catalog: Post[] = [];
    if (page > 1) {
      return [];
    }
    // console.log(filter);

    const url = `${baseUrl + filter}`;
    // console.log(url);
    const cookie = (await nfGetCookie()) + ' hd=on; ott=nf;';
    console.log('nfCookie', cookie);
    const res = await fetch(url, {
      headers: {
        accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'accept-language': 'en-US,en;q=0.9,en-IN;q=0.8',
        'cache-control': 'no-cache',
        pragma: 'no-cache',
        cookie: cookie,
        priority: 'u=0, i',
        'sec-ch-ua':
          '"Chromium";v="130", "Microsoft Edge";v="130", "Not?A_Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'same-origin',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
      },
      referrer: 'https://iosmirror.cc/movies',
      referrerPolicy: 'strict-origin-when-cross-origin',
      body: null,
      signal: signal,
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    });
    const data = await res.text();
    // console.log('nfPost', data);
    const $ = cheerio.load(data);
    $('a.post-data').map((i, element) => {
      const title = '';
      const id = $(element).attr('data-post');
      console.log('id', id);
      const image = $(element).find('img').attr('data-src') || '';
      if (id) {
        catalog.push({
          title: title,
          link:
            baseUrl +
            '/post.php?id=' +
            id +
            '&t=' +
            Math.round(new Date().getTime() / 1000),
          image: image,
        });
      }
    });
    console.log(catalog);
    return catalog;
  } catch (err) {
    console.error('nf error ', err);
    return [];
  }
};

export const nfGetPostsSearch = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    if (page > 1) {
      return [];
    }
    const catalog: Post[] = [];
    const baseUrl = await getBaseUrl('nfMirror');
    const url = `${baseUrl + '/search.php?s=' + encodeURI(searchQuery)}`;
    // console.log('search', url);
    const headers = await getNfHeaders();
    const res = await axios.get(url, {headers, signal});
    const data = res.data;
    data?.searchResult.map((result: any) => {
      const title = result?.t;
      const id = result?.id;
      const image = `https://img.nfmirrorcdn.top/poster/v/${id}.jpg`;
      if (id) {
        catalog.push({
          title: title,
          link:
            baseUrl +
            '/post.php?id=' +
            id +
            '&t=' +
            Math.round(new Date().getTime() / 1000),
          image: image,
        });
      }
    });
    // console.log('nfSearch', catalog);
    return catalog;
  } catch (err) {
    console.error('nf error ', err);
    return [];
  }
};

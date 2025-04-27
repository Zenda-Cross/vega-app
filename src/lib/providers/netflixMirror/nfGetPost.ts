import * as cheerio from 'cheerio';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

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
    const isPrime =
      providerValue === 'primeMirror' ? 'isPrime=true' : 'isPrime=false';

    const url = `https://netmirror.8man.me/api/net-proxy?${isPrime}&url=${
      baseUrl + filter
    }`;

    const res = await fetch(url, {
      signal: signal,
      method: 'GET',
      credentials: 'omit',
    });
    const data = await res.text();
    // console.log('nfPost', data);
    const $ = cheerio.load(data);
    $('a.post-data').map((i, element) => {
      const title = '';
      const id = $(element).attr('data-post');
      // console.log('id', id);
      const image = $(element).find('img').attr('data-src') || '';
      if (id) {
        catalog.push({
          title: title,
          link:
            baseUrl +
            `${
              providerValue === 'netflixMirror'
                ? '/post.php?id='
                : '/pv/post.php?id='
            }` +
            id +
            '&t=' +
            Math.round(new Date().getTime() / 1000),
          image: image,
        });
      }
    });
    // console.log(catalog);
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
    const isPrime =
      providerValue === 'primeMirror' ? 'isPrime=true' : 'isPrime=false';

    const url = `https://netmirror.8man.me/api/net-proxy?${isPrime}&url=${baseUrl}${
      providerValue === 'netflixMirror' ? '' : '/pv'
    }/search.php?s=${encodeURI(searchQuery)}`;

    const res = await fetch(url, {
      signal: signal,
      method: 'GET',
      credentials: 'omit',
    });

    const data = await res.json();

    data?.searchResult?.forEach((result: any) => {
      const title = result?.t || '';
      const id = result?.id;
      const image =
        providerValue === 'netflixMirror'
          ? `https://imgcdn.media/poster/v/${id}.jpg`
          : '';

      if (id) {
        catalog.push({
          title: title,
          link:
            baseUrl +
            `${
              providerValue === 'netflixMirror'
                ? '/mobile/post.php?id='
                : '/mobile/pv/post.php?id='
            }` +
            id +
            '&t=' +
            Math.round(new Date().getTime() / 1000),
          image: image,
        });
      }
    });

    return catalog;
  } catch (err) {
    console.error('Search error:', err);
    return [];
  }
};

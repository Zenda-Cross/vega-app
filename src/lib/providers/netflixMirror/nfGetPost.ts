import axios from 'axios';
import * as cheerio from 'cheerio';
import {getNfHeaders} from './nfHeaders';
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

    const url = `${baseUrl + filter}`;
    // console.log(url);
    const headers = await getNfHeaders();
    const res = await fetch(url, {headers, signal, credentials: 'omit'});
    const data = await res.text();
    const $ = cheerio.load(data);
    $('a.post-data').map((i, element) => {
      const title = '';
      const id = $(element).attr('data-post');
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

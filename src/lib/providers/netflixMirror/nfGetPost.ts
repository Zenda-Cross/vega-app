import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from './nfHeaders';
import {Post} from '../types';

export const nfGetPost = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const baseUrl = 'https://iosmirror.cc';
    const catalog: Post[] = [];
    if (page > 1) {
      return [];
    }
    // console.log(filter);
    if (filter.includes('searchQuery=')) {
      const url = `${
        baseUrl +
        '/search.php?s=' +
        encodeURI(filter.replace('searchQuery=', ''))
      }`;
      // console.log('search', url);
      const res = await axios.get(url, {headers, signal});
      const data = res.data;
      data?.searchResult.map((result: any) => {
        const title = result?.t;
        const id = result?.id;
        const image = `https://img.nfmirrorcdn.top/poster/v/${id}.jpg`;
        if (id) {
          catalog.push({
            title: title,
            link: id,
            image: image,
          });
        }
      });
      // console.log('nfSearch', catalog);
      return catalog;
    } else {
      const url = `${baseUrl + filter}`;
      // console.log(url);
      const res = await axios.get(url, {headers, signal});
      const data = res.data;
      const $ = cheerio.load(data);
      $('a.post-data').map((i, element) => {
        const title = '';
        const id = $(element).attr('data-post');
        const image = `https://img.nfmirrorcdn.top/poster/v/${id}.jpg`;
        if (id) {
          catalog.push({
            title: title,
            link: id,
            image: image,
          });
        }
      });
      // console.log(catalog);
      return catalog;
    }
  } catch (err) {
    console.error('nf error ', err);
    return [];
  }
};

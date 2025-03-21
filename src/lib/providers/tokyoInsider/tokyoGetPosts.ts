import axios from 'axios';
import {Post} from '../types';
import {headers} from './header';
import * as cheerio from 'cheerio';
import {getBaseUrl} from '../getBaseUrl';

export const tokyoGetPosts = async (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> => {
  const baseURL = await getBaseUrl('tokyoinsider');
  const start = page < 2 ? 0 : (page - 1) * 20;
  const url = `${baseURL}/${filter}&start=${start}`;
  // console.log('url', url);
  return posts(baseURL, url, signal);
};

export const tokyoGetPostsSearch = async (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> => {
  const baseURL = await getBaseUrl('tokyoinsider');
  const start = page < 2 ? 0 : (page - 1) * 20;
  const url = `${baseURL}/anime/search?k=${searchQuery}&start=${start}`;
  // console.log('url', url);
  return posts(baseURL, url, signal);
};

async function posts(
  baseURL: string,
  url: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const res = await axios.get(url, {signal, headers});
    const data = res.data;
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('td.c_h2[width="40"]').map((i, element) => {
      const image = $(element)
        .find('.a_img')
        .attr('src')
        ?.replace('small', 'default');
      const title = $(element).find('a').attr('title');
      const link = baseURL + $(element).find('a').attr('href');
      if (title && link && image) {
        catalog.push({
          title: title,
          link: link,
          image: image,
        });
      }
    });
    // console.log(catalog);
    return catalog;
  } catch (err) {
    // console.log('tokyoGetPosts');
    console.error('tokyo error ', err);
    return [];
  }
}

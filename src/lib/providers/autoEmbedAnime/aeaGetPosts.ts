import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const aeaGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('aea');
  const url = `${baseUrl + filter}?page=${page}`;

  return await autoEmbedDramaAndAnimePosts(baseUrl, url, signal);
};

export const aeaGetSearchPosts = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  if (page > 1) {
    return [];
  }
  const baseUrl = await getBaseUrl('aea');
  const url = `${baseUrl}/search.html?keyword=${searchQuery}`;

  return await autoEmbedDramaAndAnimePosts(baseUrl, url, signal);
};

export async function autoEmbedDramaAndAnimePosts(
  baseUrl: string,
  url: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const res = await fetch(url, {headers, signal});
    const data = await res.text();
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.video-block').map((i, element) => {
      const title = $(element).find('.name').text();
      const link = $(element).find('a').attr('href');
      const image = $(element).find('img').attr('src');
      //   console.log('title', title.trim());
      if (title && link && image) {
        catalog.push({
          // replace Episode \d+ with empty string
          title: title?.trim()?.replace(/Episode \d+/g, ''),
          link: baseUrl + link,
          image: image,
        });
      }
    });

    return catalog;
  } catch (err) {
    console.error('AEA error ', err);
    return [];
  }
}

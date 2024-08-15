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
  try {
    const baseUrl = await getBaseUrl('aea');
    // console.log(baseUrl);
    if (filter.includes('searchQuery=') && page > 1) {
      return [];
    }
    const url = filter.includes('searchQuery=')
      ? `${baseUrl}/search.html?keyword=${filter.replace('searchQuery=', '')}`
      : `${baseUrl + filter}?page=${page}`;
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
};

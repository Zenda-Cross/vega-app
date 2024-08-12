import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const world4uGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const baseUrl = await getBaseUrl('w4u');
    const url = filter.includes('searchQuery=')
      ? `${baseUrl}/page/${page}/?s=${filter.replace('searchQuery=', '')}`
      : `${baseUrl + filter}/page/${page}/`;
    // console.log('world4uGetPosts', url);
    const res = await axios.get(url, {headers, signal});
    const data = res.data;
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.recent-posts')
      .children()
      .map((i, element) => {
        const title = $(element).find('.post-thumb').find('a').attr('title');
        const link = $(element).find('.post-thumb').find('a').attr('href');
        const image =
          $(element).find('.post-thumb').find('img').attr('data-src') ||
          $(element).find('.post-thumb').find('img').attr('src');
        if (title && link && image) {
          catalog.push({
            title: title.replace('Download', '').trim(),
            link: link,
            image: image,
          });
        }
      });
    // console.log('world4uGetPosts', catalog);
    return catalog;
  } catch (err) {
    console.error('world4u error ', err);
    return [];
  }
};

import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const clGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('cinemaLuxe');
  // console.log(baseUrl);
  const url = `${baseUrl + filter}page/${page}/`;
  console.log('multiUrl', url);

  return posts(url, signal);
};

export const clGetPostsSearch = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('cinemaLuxe');
  // console.log(baseUrl);
  const url = `${baseUrl}/page/${page}/?s=${searchQuery}`;
  console.log('multiUrl', url);

  return posts(url, signal);
};

async function posts(url: string, signal: AbortSignal): Promise<Post[]> {
  try {
    const res = await fetch(url, {headers, signal});
    const data = await res.text();
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.item.tvshows,.item.movies').map((i, element) => {
      const title = $(element).find('.poster').find('img').attr('alt');
      const link = $(element).find('.poster').find('a').attr('href');
      const image = $(element).find('.poster').find('img').attr('data-src');
      if (title && link && image) {
        catalog.push({
          title: title,
          link: link,
          image: image,
        });
      }
    });
    $('.result-item').map((i, element) => {
      const title = $(element).find('.thumbnail').find('img').attr('alt');
      const link = $(element).find('.thumbnail').find('a').attr('href');
      const image = $(element).find('.thumbnail').find('img').attr('data-src');
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
    console.error('cinemaluxe error ', err);
    return [];
  }
}

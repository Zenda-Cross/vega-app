import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const ffGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('filmyfly');
  // console.log(baseUrl);
  const url = `${baseUrl + filter}/${page}`;
  console.log('ff', url);

  return posts(url, signal, baseUrl);
};

export const ffGetPostsSearch = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('filmyfly');
  // console.log(baseUrl);
  const url = `${baseUrl}/site-1.html?to-search=${searchQuery}`;
  console.log('ff', url);
  if (page > 1) {
    return [];
  }

  return posts(url, signal, baseUrl);
};

async function posts(
  url: string,
  signal: AbortSignal,
  baseUrl: string,
): Promise<Post[]> {
  try {
    const res = await fetch(url, {headers, signal});
    const data = await res.text();
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.A2,.A10,.fl').map((i, element) => {
      const title =
        $(element).find('a').eq(1).text() || $(element).find('b').text();
      const link = $(element).find('a').attr('href');
      const image = $(element).find('img').attr('src');
      // console.log('ff', title, link, image);
      if (title && link && image) {
        catalog.push({
          title: title,
          link: baseUrl + link,
          image: image,
        });
      }
    });
    // $('.result-item').map((i, element) => {
    //   const title = $(element).find('.thumbnail').find('img').attr('alt');
    //   const link = $(element).find('.thumbnail').find('a').attr('href');
    //   const image = $(element).find('.thumbnail').find('img').attr('data-src');
    //   if (title && link && image) {
    //     catalog.push({
    //       title: title,
    //       link: link,
    //       image: image,
    //     });
    //   }
    // });
    // console.log(catalog);
    return catalog;
  } catch (err) {
    console.error('ff error ', err);
    return [];
  }
}

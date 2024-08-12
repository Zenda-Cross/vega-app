import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const katGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const baseUrl = await getBaseUrl('kat');
    const url = filter.includes('searchQuery=')
      ? `${baseUrl}/page/${page}/?s=${filter.replace('searchQuery=', '')}`
      : `${baseUrl + filter}/page/${page}/`;
    // console.log('katGetPosts', url);
    const res = await fetch(url, {headers, signal});
    const data = await res.text();
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.recent-posts')
      .children()
      .map((i, element) => {
        const title = $(element).find('img').attr('alt');
        const link = $(element).find('a').attr('href');
        const image = $(element).find('img').attr('src');
        // console.log('katGetPosts', title, link, image);
        if (title && link && image) {
          catalog.push({
            title: title.replace('Download', '').trim(),
            link: link,
            image: image,
          });
        }
      });
    // console.log(catalog);
    return catalog;
  } catch (err) {
    console.error('katmovies error ', err);
    return [];
  }
};

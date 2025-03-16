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
  const baseUrl = await getBaseUrl('kat');
  const url = `${baseUrl + filter}/page/${page}/`;
  // console.log('katGetPosts', url);
  return posts(url, signal);
};

export const katGetPostsSearch = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('kat');
  const url = `${baseUrl}/page/${page}/?s=${searchQuery}`;
  // console.log('katGetPosts', url);

  return posts(url, signal);
};

async function posts(url: string, signal: AbortSignal): Promise<Post[]> {
  try {
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
}

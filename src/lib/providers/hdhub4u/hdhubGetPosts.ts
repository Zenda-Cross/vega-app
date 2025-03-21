import * as cheerio from 'cheerio';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';
import {hdbHeaders} from './hdbHeaders';

export const hdhubGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('hdhub');
  const url = `${baseUrl + filter}/page/${page}/`;
  console.log('hdhubGetPosts', url);
  return posts(url, signal);
};

export const hdhubGetPostsSearch = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('hdhub');
  const url = `${baseUrl}/page/${page}/?s=${searchQuery}`;
  // console.log('hdhubGetPosts', url);
  return posts(url, signal);
};

async function posts(url: string, signal: AbortSignal): Promise<Post[]> {
  try {
    const res = await fetch(url, {
      headers: hdbHeaders,
      signal,
    });
    const data = await res.text();
    console.log('hdhubGetPosts', data);
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.recent-movies')
      .children()
      .map((i, element) => {
        const title = $(element).find('figure').find('img').attr('alt');
        const link = $(element).find('a').attr('href');
        const image = $(element).find('figure').find('img').attr('src');

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
    console.error('hdhub error ', err);
    return [];
  }
}

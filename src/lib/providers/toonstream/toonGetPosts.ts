import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const toonGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = 'https://toonstream.co';
  const url = `${baseUrl + filter}/page/${page}/`;

  return posts(url, signal);
};

export const toonGetPostsSearch = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = 'https://toonstream.co';
  const url = `${baseUrl}/page/${page}/?s=${searchQuery}`;
  return posts(url, signal);
};

async function posts(url: string, signal: AbortSignal): Promise<Post[]> {
  try {
    const res = await axios.get(url, {headers, signal});
    const data = res.data;
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('ul.post-lst')
      .first()
      .children()
      .map((i, element) => {
        const title = $(element).find('.entry-title').text();
        const link = $(element).find('a').attr('href');
        const image =
          $(element).find('img').attr('data-src') ||
          $(element).find('img').attr('src') ||
          '';

        console.log('toonstream image', image);
        if (title && link) {
          catalog.push({
            title: title,
            link: link,
            image: image.includes('https') ? image : 'https:' + image,
          });
        }
      });
    console.log('toonstream catalog', catalog);
    return catalog;
  } catch (err) {
    console.error('toonstream error ', err);
    return [];
  }
}

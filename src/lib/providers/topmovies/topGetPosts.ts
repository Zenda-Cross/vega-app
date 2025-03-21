import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../mod/header';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const topGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('Topmovies');
  const url = `${baseUrl + filter}/page/${page}/`;

  return posts(url, signal);
};

export const topGetPostsSearch = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('Topmovies');
  const url = `${baseUrl}/search/${searchQuery}/page/${page}/`;
  return posts(url, signal);
};

async function posts(url: string, signal: AbortSignal): Promise<Post[]> {
  try {
    const res = await axios.get(url, {headers, signal});
    const data = res.data;
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.post-cards')
      .find('article')
      .map((i, element) => {
        const title = $(element).find('a').attr('title');
        const link = $(element).find('a').attr('href');
        const image =
          $(element).find('img').attr('data-src') ||
          $(element).find('img').attr('src') ||
          '';
        if (title && link) {
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
    console.error('mod error ', err);
    return [];
  }
}

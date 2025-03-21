import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from './header';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const uhdGetPosts = async (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> => {
  const baseUrl = await getBaseUrl('UhdMovies');
  const url =
    page === 1 ? `${baseUrl}/${filter}/` : `${baseUrl + filter}/page/${page}/`;
  console.log('url', url);

  return posts(baseUrl, url, signal);
};

export const uhdGetPostsSearch = async (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> => {
  const baseUrl = await getBaseUrl('UhdMovies');
  const url = `${baseUrl}/search/${searchQuery}/page/${page}/`;

  return posts(baseUrl, url, signal);
};

async function posts(
  baseURL: string,
  url: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const res = await axios.get(url, {headers, signal});
    const html = res.data;
    const $ = cheerio.load(html);
    const uhdCatalog: Post[] = [];

    $('.gridlove-posts')
      .find('.layout-masonry')
      .each((index, element) => {
        const title = $(element).find('a').attr('title');
        const link = $(element).find('a').attr('href');
        const image = $(element).find('a').find('img').attr('src');

        if (title && link && image) {
          uhdCatalog.push({
            title: title.replace('Download', '').trim(),
            link: link,
            image: image,
          });
        }
      });
    return uhdCatalog;
  } catch (err) {
    console.error('uhd error ', err);
    return [];
  }
}

import axios from 'axios';
import {Post} from '../types';
import {headers} from './header';
import * as cheerio from 'cheerio';

export const tokyoGetPosts = async (
  filter: string,
  page: number,
  provider: Content['provider'],
  signal: AbortSignal,
): Promise<Post[]> => {
  try {
    const baseURL = 'https://www.tokyoinsider.com';
    const start = page < 2 ? 0 : (page - 1) * 20;
    const url = filter.includes('query')
      ? `${baseURL}/anime/search?k=${filter.replace(
          'query',
          '',
        )}&start=${start}`
      : `${baseURL}/${filter}&start=${start}`;
    console.log('url', url);
    const res = await axios.get(url, {signal, headers});
    const data = res.data;
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('td.c_h2[width="40"]').map((i, element) => {
      const image = $(element)
        .find('.a_img')
        .attr('src')
        ?.replace('small', 'default');
      const title = $(element).find('a').attr('title');
      const link = baseURL + $(element).find('a').attr('href');
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
    console.log('tokyoGetPosts');
    // console.error(err);
    return [];
  }
};

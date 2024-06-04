import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from './header';
import {Post} from '../types';
import {uhdGetBaseurl} from './uhdGetBaseurl';
import {Content} from '../../zustand/contentStore';

export const uhdGetPosts = async (
  filter: string,
  page: number,
  provider: Content['provider'],
  signal: AbortSignal,
): Promise<Post[]> => {
  try {
    const baseUrl = await uhdGetBaseurl();
    const url = filter.includes('search')
      ? `${baseUrl}/search/${filter.replace('search', '')}/page/${page}/`
      : `${baseUrl + filter}/page/${page}/`;
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
    // console.error(err);
    return [];
  }
};

import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from './header';
import {Post} from '../types';
import {Content} from '../../zustand/contentStore';
import {modGetBaseurl} from './modGetBaseurl';

export const modGetPosts = async function (
  filter: string,
  page: number,
  provider: Content['provider'],
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const baseUrl = await modGetBaseurl(provider);
    const url = filter.includes('search')
      ? `${baseUrl}/search/${filter.replace('search', '')}/page/${page}/`
      : `${baseUrl + filter}/page/${page}/`;
    const res = await axios.get(url, {headers, signal});
    const data = res.data;
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.post-cards')
      .find('article')
      .map((i, element) => {
        const title = $(element).find('a').attr('title');
        const link = $(element).find('a').attr('href');
        const image = $(element).find('img').attr('src');
        if (title && link && image) {
          catalog.push({
            title: title.replace('Download', '').trim(),
            link: link.replace(baseUrl, ''),
            image: image,
          });
        }
      });
    // console.log(catalog);
    return catalog;
  } catch (err) {
    // console.error(err);
    return [];
  }
};

import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Post} from '../types';
import {Content} from '../../zustand/contentStore';

export const dcGetPosts = async function (
  filter: string,
  page: number,
  provider: Content['provider'],
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const baseUrl = 'https://asianc.sh';
    const url = filter.includes('query')
      ? `${baseUrl}/search?type=movies&keyword=${filter.replace(
          'query',
          '',
        )}&page=${page}`
      : `${baseUrl + filter}?page=${page}`;
    console.log('dcUrrl', url);

    const res = await axios.get(url, {headers, signal});
    const data = res.data;
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.switch-block.list-episode-item')
      .children()
      .map((i, element) => {
        const title =
          $(element).find('a').attr('title') ||
          $(element).find('.title').text();
        const link = $(element).find('a').attr('href');
        const image = $(element).find('img').attr('data-original');
        console.log('dcTitle', title, link, image);
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
    console.error(err);
    return [];
  }
};

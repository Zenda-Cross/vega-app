import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from './header';
import {Post} from '../types';
import {Content} from '../../zustand/contentStore';

export const world4uGetPosts = async function (
  filter: string,
  page: number,
  provider: Content['provider'],
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const urlRes = await axios.get(
      'https://himanshu8443.github.io/providers/modflix.json',
    );
    const dataRes = urlRes.data;
    const baseUrl = dataRes?.w4u?.url;
    const url = filter.includes('query')
      ? `${baseUrl}/page/${page}/?s=${filter.replace('query', '')}`
      : `${baseUrl + filter}/page/${page}/`;
    console.log('world4uGetPosts', url);
    const res = await axios.get(url, {headers, signal});
    const data = res.data;
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.recent-posts')
      .children()
      .map((i, element) => {
        const title = $(element).find('.post-thumb').find('a').attr('title');
        const link = $(element).find('.post-thumb').find('a').attr('href');
        const image =
          $(element).find('.post-thumb').find('img').attr('data-src') ||
          $(element).find('.post-thumb').find('img').attr('src');
        if (title && link && image) {
          catalog.push({
            title: title.replace('Download', '').trim(),
            link: link,
            image: image,
          });
        }
      });
    // console.log('world4uGetPosts', catalog);
    return catalog;
  } catch (err) {
    console.error(err);
    return [];
  }
};

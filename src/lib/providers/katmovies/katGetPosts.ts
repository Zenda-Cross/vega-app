import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Post} from '../types';
import {Content} from '../../zustand/contentStore';

export const katGetPosts = async function (
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
    // console.log(dataRes);
    const baseUrl = dataRes?.kat?.url;
    const url = filter.includes('searchQuery=')
      ? `${baseUrl}/page/${page}/?s=${filter.replace('searchQuery=', '')}`
      : `${baseUrl + filter}/page/${page}/`;
    console.log('katGetPosts', url);
    const res = await axios.get(url, {headers, signal});
    const data = res.data;
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
    // console.error(err);
    return [];
  }
};

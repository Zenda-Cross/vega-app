import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const dcGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  console.log('dcGetPosts', filter, page);
  const baseUrl = await getBaseUrl('dc');
  const url = `${baseUrl + filter}?page=${page}`;
  console.log('dcUrl', url);
  return posts(url, signal);
};

export const dcGetSearchPost = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('dc');
  const url = `${baseUrl}/search?type=movies&keyword=${searchQuery}&page=${page}`;
  // console.log('dcUrrl', url);
  return posts(url, signal);
};

async function posts(url: string, signal: AbortSignal): Promise<Post[]> {
  try {
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
        // console.log('dcTitle', title, link, image);
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
    console.error('dc error ', err);
    return [];
  }
}

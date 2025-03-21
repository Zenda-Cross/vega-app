import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Post} from '../types';
import Aes from 'react-native-aes-crypto';
import {getBaseUrl} from '../getBaseUrl';

const getSHA256ofJSON = async function (input: any) {
  return await Aes.sha1(input);
};

export const pwGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('primewire');
  const url = `${baseUrl + filter}&page=${page}`;
  // console.log(url);

  return posts(baseUrl, url, signal);
};

export const pwGetPostsSearch = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('primewire');
  const hash = await getSHA256ofJSON(searchQuery + 'JyjId97F9PVqUPuMO0');
  // console.log('hash', hash);
  const url = `${baseUrl}/filter?s=${searchQuery}&page=${page}&ds=${hash.slice(
    0,
    10,
  )}`;
  // console.log(url);

  return posts(baseUrl, url, signal);
};

async function posts(
  baseUrl: string,
  url: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const res = await axios.get(url, {headers, signal});
    const data = res.data;
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.index_item.index_item_ie').map((i, element) => {
      const title = $(element).find('a').attr('title');
      const link = $(element).find('a').attr('href');
      const image = $(element).find('img').attr('src') || '';
      if (title && link) {
        catalog.push({
          title: title,
          link: baseUrl + link,
          image: baseUrl + image,
        });
      }
    });
    // console.log(catalog);
    return catalog;
  } catch (err) {
    console.error('pw error ', err);
    return [];
  }
}

import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Post} from '../types';
import {Content} from '../../zustand/contentStore';
import Aes from 'react-native-aes-crypto';

const getSHA256ofJSON = async function (input: any) {
  return await Aes.sha1(input);
};

export const pwGetPosts = async function (
  filter: string,
  page: number,
  provider: Content['provider'],
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const baseUrl = 'https://www.primewire.tf';
    const hash = await getSHA256ofJSON(
      filter.replace('query', '') + 'JyjId97F9PVqUPuMO0',
    );
    console.log('hash', hash);
    const url = filter.includes('query')
      ? `${baseUrl}/filter?s=${filter.replace(
          'query',
          '',
        )}&page=${page}&ds=${hash.slice(0, 10)}`
      : `${baseUrl + filter}&page=${page}`;
    console.log(url);
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
    // console.error(err);
    return [];
  }
};

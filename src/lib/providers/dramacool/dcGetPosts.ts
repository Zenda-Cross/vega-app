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
    const urlRes = await axios.get(
      'https://himanshu8443.github.io/providers/modflix.json',
    );
    const dataRes = urlRes.data;
    // console.log(dataRes.hdhub.url);
    const baseUrl = dataRes?.dc?.url;
    console.log('dcBaseUrl', baseUrl);
    const url = filter.includes('searchQuery=')
      ? `${baseUrl}/search?type=movies&keyword=${filter.replace(
          'searchQuery=',
          '',
        )}&page=${page}`
      : `${baseUrl + filter}?page=${page}`;
    // console.log('dcUrrl', url);

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

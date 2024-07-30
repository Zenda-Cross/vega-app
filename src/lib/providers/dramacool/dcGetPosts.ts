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
      'https://consumet8.vercel.app/movies/dramacool/info?id=drama-detail/shogun',
    );
    const resData = urlRes.data.episodes[0].url;
    const baseUrl = resData.split('/').slice(0, 3).join('/');
    console.log('dcBaseUrl', baseUrl);
    const url = filter.includes('query')
      ? `${baseUrl}/search?type=movies&keyword=${filter.replace(
          'query',
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

import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';
import {decodeHtml} from './protonGetMeta';

export const protonGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('protonMovies');
  // console.log('protonGetPosts', baseUrl);
  const url = `${baseUrl + filter}/page/${page}/`;
  // console.log('proton url', url);
  return posts(url, baseUrl, signal);
};

export const protonGetPostsSearch = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('protonMovies');
  const url = `${baseUrl}/search/${searchQuery}/page/${page}/`;
  // console.log('protonGetPostsSearch', url);
  return posts(url, baseUrl, signal);
};

async function posts(
  url: string,
  baseUrl: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const res = await axios.get(url, {
      headers: {
        ...headers,
        referer: baseUrl,
      },
      signal,
    });
    const data = res.data;
    const regex = /\[(?=.*?"<div class")(.*?)\]/g;
    const htmlArray = data?.match(regex);
    // console.log('protonGetPosts', JSON.parse(htmlArray[htmlArray.length - 1]));
    const html = decodeHtml(JSON.parse(htmlArray[htmlArray.length - 1]));
    // console.log('protonGet html', html);
    const $ = cheerio.load(html);
    const catalog: Post[] = [];
    $('.col.mb-4').map((i, element) => {
      const title = $(element).find('h5').text();
      const link = $(element).find('h5').find('a').attr('href');
      const image =
        $(element).find('img').attr('data-src') ||
        $(element).find('img').attr('src') ||
        '';
      // console.log('protonGetPosts', title, link, image);
      if (title && link) {
        catalog.push({
          title: title.replace('Download', '').trim(),
          link: baseUrl + link,
          image: image,
        });
      }
    });
    // console.log(catalog);
    return catalog;
  } catch (err) {
    console.error('proton error ', err);
    return [];
  }
}

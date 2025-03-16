import * as cheerio from 'cheerio';
import {headers} from './header';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const driveGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('drive');
  const url = `${baseUrl + filter}/page/${page}/`;
  return posts(url, signal);
};

export const driveGetSearchPost = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('drive');
  const url = `${baseUrl}page/${page}/?s=${searchQuery}`;

  return posts(url, signal);
};

async function posts(url: string, signal: AbortSignal): Promise<Post[]> {
  try {
    const res = await fetch(url, {headers, signal});
    const data = await res.text();
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.recent-movies')
      .children()
      .map((i, element) => {
        const title = $(element).find('figure').find('img').attr('alt');
        const link = $(element).find('a').attr('href');
        const image = $(element).find('figure').find('img').attr('src');
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
    console.error('drive error ', err);
    return [];
  }
}

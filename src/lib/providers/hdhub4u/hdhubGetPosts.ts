import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Post} from '../types';

export const hdhubGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const urlRes = await fetch(
      'https://himanshu8443.github.io/providers/modflix.json',
    );
    const dataRes = await urlRes.json();
    // console.log(dataRes.hdhub.url);
    const baseUrl = dataRes?.hdhub?.url;
    const url = filter.includes('searchQuery=')
      ? `${baseUrl}/page/${page}/?s=${filter.replace('searchQuery=', '')}`
      : `${baseUrl + filter}/page/${page}/`;
    // console.log('hdhubGetPosts', url);
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
    console.error('hdhub error ', err);
    return [];
  }
};

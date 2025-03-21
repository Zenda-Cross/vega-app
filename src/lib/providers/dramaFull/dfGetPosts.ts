import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const dfGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('dramafull');
  // console.log(baseUrl);
  const url = `${baseUrl + filter}?page=${page}`;
  console.log('dramafull', url);

  return posts(url, signal);
};

export const dfGetPostsSearch = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('multi');
  // console.log(baseUrl);
  const url = `${baseUrl}/?s=${searchQuery}`;
  console.log('df', url);

  return posts(url, signal);
};

async function posts(url: string, signal: AbortSignal): Promise<Post[]> {
  try {
    const res = await fetch(url, {headers, signal});
    const data = await res.text();
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.film_list-wrap')
      .children()
      .map((i, element) => {
        const title = $(element).find('.film-name').text();
        const link = $(element).find('.film-name').find('a').attr('href');
        const image = $(element)
          .find('.film-poster')
          .find('img')
          .attr('data-src');
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
    console.error('dramafull error ', err);
    return [];
  }
}

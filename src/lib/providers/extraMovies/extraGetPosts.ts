import * as cheerio from 'cheerio';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';
import axios from 'axios';

export const ExtraGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('extra');
  const url = `${baseUrl + filter}/page/${page}/`;
  console.log('extraGetPosts', url);

  return posts(url, signal);
};

export const ExtraGetSearchPost = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('extra');
  const url = `${baseUrl}/page/${page}/?s=${searchQuery}`;
  console.log('extraGetPosts', url);

  return posts(url, signal);
};

async function posts(url: string, signal: AbortSignal): Promise<Post[]> {
  try {
    const res = await axios(url, {signal});
    const data = res.data;
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.gridshow-posts.gridshow-posts-grid')
      .children()
      .map((i, element) => {
        const title = $(element)
          .find('.gridshow-grid-post-thumbnail.gridshow-grid-post-block')
          .find('img')
          .attr('title');
        const link = $(element)
          .find('.gridshow-grid-post-thumbnail.gridshow-grid-post-block')
          .find('a')
          .attr('href');
        const image =
          $(element)
            .find('.gridshow-grid-post-thumbnail.gridshow-grid-post-block')
            .find('img')
            .attr('data-lazy-src') ||
          $(element)
            .find('.gridshow-grid-post-thumbnail.gridshow-grid-post-block')
            .find('img')
            .attr('src') ||
          '';
        if (title && link) {
          catalog.push({
            title: title.replace('Download ', '').trim(),
            link: link,
            image: image,
          });
        }
      });
    // console.log(catalog);
    return catalog;
  } catch (err) {
    console.error('extra movies error ', err);
    return [];
  }
}

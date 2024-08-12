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
  try {
    const baseUrl = await getBaseUrl('extra');
    const url = filter.includes('searchQuery=')
      ? `${baseUrl}/page/${page}/?s=${filter.replace('searchQuery=', '')}`
      : `${baseUrl + filter}/page/${page}/`;
    console.log('extraGetPosts', url);
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
};

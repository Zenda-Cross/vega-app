import axios from 'axios';
import * as cheerio from 'cheerio';
import {headers} from '../headers';
import {Post} from '../types';
import {Content} from '../../zustand/contentStore';

export const ExtraGetPosts = async function (
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
    console.log(dataRes.extra.url);
    const baseUrl = dataRes?.extra?.url;
    const url = filter.includes('query')
      ? `${baseUrl}/page/${page}/?s=${filter.replace('query', '')}`
      : `${baseUrl + filter}/page/${page}/`;
    console.log(url);
    const res = await axios.get(url, {headers, signal});
    const data = res.data;
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.gridshow-posts.gridshow-posts-grid')
      .children()
      .map((i, element) => {
        const title = $(element)
          .find('.gridshow-grid-post-thumbnail.gridshow-grid-post-block')
          .find('a')
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
            title: title.replace('Download', '').trim(),
            link: link,
            image: image,
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

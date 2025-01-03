import * as cheerio from 'cheerio';
import axios from 'axios';
import {headers} from './header';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const vegaGetPosts = async (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> => {
  const baseUrl = await getBaseUrl('Vega');

  console.log('vegaGetPosts baseUrl:', providerValue, baseUrl);
  const url = `${baseUrl}/${filter}/page/${page}/`;
  console.log('vegaGetPosts url:', url);
  return posts(baseUrl, url, signal);
};

export const vegaGetPostsSearch = async (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> => {
  const baseUrl = await getBaseUrl('Vega');

  console.log('vegaGetPosts baseUrl:', providerValue, baseUrl);
  const url = `${baseUrl}/page/${page}/?s=${searchQuery}`;
  console.log('vegaGetPosts url:', url);

  return posts(baseUrl, url, signal);
};

async function posts(
  baseUrl: string,
  url: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const urlRes = await axios.get(url, {
      headers: {
        ...headers,
        Referer: baseUrl,
      },
      signal,
    });
    const $ = cheerio.load(urlRes.data);
    const posts: Post[] = [];
    $('.blog-items,.post-list')
      ?.children('article')
      ?.each((index, element) => {
        const post = {
          title:
            $(element)
              ?.find('a')
              ?.attr('title')
              ?.replace('Download', '')
              ?.match(/^(.*?)\s*\((\d{4})\)|^(.*?)\s*\((Season \d+)\)/)?.[0] ||
            $(element)?.find('a')?.attr('title')?.replace('Download', '') ||
            $(element)?.find('.post-title').text()?.replace('Download', '') ||
            '',

          link: $(element)?.find('a')?.attr('href') || '',
          image:
            $(element).find('a').find('img').attr('data-lazy-src') ||
            $(element).find('a').find('img').attr('data-src') ||
            $(element).find('a').find('img').attr('src') ||
            '',
        };
        if (post.image.startsWith('//')) {
          post.image = 'https:' + post.image;
        }
        posts.push(post);
      });

    // console.log(posts);
    return posts;
  } catch (error) {
    console.error('vegaGetPosts error:', error);
    return [];
  }
}

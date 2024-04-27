import * as cheerio from 'cheerio';
import axios from 'axios';

export interface Post {
  title: string;
  link: string;
  image: string;
}

export const getPosts = async (
  filter: string,
  page: number,
): Promise<Post[]> => {
  try {
    const baseUrl = 'https://vegamovies.ph';
    const url = filter.includes('category')
      ? `${baseUrl}/${filter}/page/${page}/`
      : `${baseUrl}/page/${page}/?s=${filter}`;
    const urlRes = await axios(url);
    // if res 301 change url to res.headers.location
    const $ = cheerio.load(urlRes.data);
    const posts: Post[] = [];
    $('.blog-items')
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
            '',

          link:
            $(element)
              ?.find('a')
              ?.attr('href')
              ?.replace('https://vegamovies.ph/', '') || '',
          image:
            $(element).find('a').find('img').attr('data-lazy-src') ||
            $(element).find('a').find('img').attr('src') ||
            '',
        };
        posts.push(post);
      });

    // console.log(posts);
    return posts;
  } catch (error) {
    console.error('error');
    return [];
  }
};

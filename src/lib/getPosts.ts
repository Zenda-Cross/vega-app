import axios from 'axios';
import * as cheerio from 'cheerio';

export interface Post {
  title: string;
  link: string;
  image: string;
}

export const getPosts = async (
  fiter: string,
  page: number,
): Promise<Post[]> => {
  try {
    const url = fiter.includes('category')
      ? `https://vegamovies.ph/${fiter}/page/${page}/`
      : `https://vegamovies.ph/page/${page}/?s=${fiter}`;
    const urlRes = await axios.get(url);
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

          link: $(element)?.find('a')?.attr('href')?.replace(url, '') || '',
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

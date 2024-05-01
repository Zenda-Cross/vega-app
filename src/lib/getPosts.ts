import * as cheerio from 'cheerio';
import axios from 'axios';
import {headers} from './header';
import {MMKV} from '../App';
import {homeList} from './constants';

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
    const baseUrl = MMKV.getString('baseUrl') || 'https://vegamovies.earth';
    const url = filter.includes('category')
      ? `${baseUrl}/${filter}/page/${page}/`
      : `${baseUrl}/page/${page}/?s=${filter}`;
    const urlRes = await axios.get(url, {headers});
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

          link: $(element)?.find('a')?.attr('href')?.replace(baseUrl, '') || '',
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
    console.log('getPosts error: ');
    // console.error(error);
    return [];
  }
};

export interface HomePageData {
  title: string;
  Posts: Post[];
}
export const getHomePageData = async (): Promise<HomePageData[]> => {
  const homeData: HomePageData[] = [];
  for (const item of homeList) {
    const data = await getPosts(item.filter, 1);
    homeData.push({
      title: item.title,
      Posts: data,
    });
  }
  return homeData;
};

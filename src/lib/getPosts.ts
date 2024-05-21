import * as cheerio from 'cheerio';
import axios from 'axios';
import {headers} from './header';
import {MMKV, MmmkvCache} from '../App';
import {homeList} from './constants';
import {Content} from './zustand/contentStore';

export interface Post {
  title: string;
  link: string;
  image: string;
}

export const getPosts = async (
  filter: string,
  page: number,
  contentType: Content['contentType'],
  signal: AbortSignal,
): Promise<Post[]> => {
  try {
    let baseUrl = '';
    if (MMKV.getBool('UseCustomUrl')) {
      baseUrl = MMKV.getString('baseUrl');
    } else {
      if (
        MmmkvCache.getString('CacheBaseUrl' + contentType) &&
        MmmkvCache.getInt('baseUrlTime' + contentType) &&
        // 30 minutes
        Date.now() - MmmkvCache.getInt('baseUrlTime' + contentType) < 1800000
      ) {
        baseUrl = MmmkvCache.getString('CacheBaseUrl' + contentType);
        console.log('baseUrl from cache', baseUrl);
      } else {
        const baseUrlRes = await axios.get(
          'https://himanshu8443.github.io/providers/modflix.json',
        );
        baseUrl =
          contentType === 'global'
            ? baseUrlRes.data.Vega.url
            : baseUrlRes.data.lux.url;
        MMKV.setString('baseUrl', baseUrl);
        MmmkvCache.setString('CacheBaseUrl' + contentType, baseUrl);
        MmmkvCache.setInt('baseUrlTime' + contentType, Date.now());
      }
    }
    const url = filter.includes('category')
      ? `${baseUrl}/${filter}/page/${page}/`
      : `${baseUrl}/page/${page}/?s=${filter}`;
    const urlRes = await axios.get(url, {headers, signal});
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
            $(element).find('a').find('img').attr('data-src') ||
            $(element).find('a').find('img').attr('src') ||
            '',
        };
        posts.push(post);
      });

    // console.log(posts);
    return posts;
  } catch (error) {
    console.log('getPosts error: ');
    MmmkvCache.removeItem('CacheBaseUrl');
    // console.error(error);
    return [];
  }
};

export interface HomePageData {
  title: string;
  Posts: Post[];
  filter: string;
}
export const getHomePageData = async (
  contentType: Content['contentType'],
  signal: AbortSignal,
): Promise<HomePageData[]> => {
  const homeData: HomePageData[] = [];
  for (const item of homeList) {
    const data = await getPosts(item.filter, 1, contentType, signal);
    homeData.push({
      title: item.title,
      Posts: data,
      filter: item.filter,
    });
  }
  return homeData;
};

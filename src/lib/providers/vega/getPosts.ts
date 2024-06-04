import * as cheerio from 'cheerio';
import axios from 'axios';
import {headers} from './header';
import {MMKV, MmmkvCache} from '../../Mmkv';
import {Content} from '../../zustand/contentStore';
import {Post} from '../types';

export const vegaGetPosts = async (
  filter: string,
  page: number,
  provider: Content['provider'],
  signal: AbortSignal,
): Promise<Post[]> => {
  try {
    let baseUrl = '';
    if (MMKV.getBool('UseCustomUrl')) {
      baseUrl = MMKV.getString('baseUrl');
    } else {
      if (
        MmmkvCache.getString('CacheBaseUrl' + provider.value) &&
        MmmkvCache.getInt('baseUrlTime' + provider.value) &&
        // 2 minutes
        Date.now() - MmmkvCache.getInt('baseUrlTime' + provider.value) < 120000
      ) {
        baseUrl = MmmkvCache.getString('CacheBaseUrl' + provider.value);
        console.log('baseUrl from cache', baseUrl);
      } else {
        const baseUrlRes = await axios.get(
          'https://himanshu8443.github.io/providers/modflix.json',
        );
        baseUrl =
          provider.value === 'vega'
            ? baseUrlRes.data.Vega.url
            : baseUrlRes.data.lux.url;
        MMKV.setString('baseUrl', baseUrl);
        MmmkvCache.setString('CacheBaseUrl' + provider.value, baseUrl);
        MmmkvCache.setInt('baseUrlTime' + provider.value, Date.now());
      }
    }
    const url = filter.includes('search')
      ? `${baseUrl}/page/${page}/?s=${filter.replace('search', '')}`
      : `${baseUrl}/${filter}/page/${page}/`;
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
    console.log('getPosts error: ');
    MmmkvCache.removeItem('CacheBaseUrl');
    // console.error(error);
    return [];
  }
};

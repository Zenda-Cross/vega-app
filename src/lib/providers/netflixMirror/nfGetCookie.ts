import axios from 'axios';
import {getBaseUrl} from '../getBaseUrl';
import * as cheerio from 'cheerio';
import {MmmkvCache} from '../../Mmkv';
import {ToastAndroid} from 'react-native';

interface ApiResponse {
  netflixCookie: {
    cookie: string;
  };
}

export async function nfGetCookie(): Promise<string> {
  try {
    const response = await axios.get<ApiResponse>(
      'https://anshu78780.github.io/json/cookie.json',
    );
    if (response.data?.netflixCookie?.cookie) {
      return response.data.netflixCookie.cookie;
    }
    throw new Error('Cookie not found in API response');
  } catch (error) {
    console.error('Failed to fetch cookie:', error);
    ToastAndroid.show('Failed to fetch cookie', ToastAndroid.SHORT);
    return '';
  }
}

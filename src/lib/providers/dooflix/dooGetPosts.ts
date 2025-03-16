import axios from 'axios';
import {headers} from './headers';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const dooGetPost = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const baseUrl = await getBaseUrl('dooflix');
    const catalog: Post[] = [];
    const url = `${baseUrl + filter + `?page=${page}`}`;

    const res = await axios.get(url, {headers, signal});
    const resData = res.data;

    if (!resData || typeof resData !== 'string') {
      console.warn('Unexpected response format from dooflix API');
      return [];
    }

    let data;
    try {
      const jsonStart = resData.indexOf('[');
      const jsonEnd = resData.lastIndexOf(']') + 1;

      if (jsonStart === -1 || jsonEnd <= jsonStart) {
        // If we can't find valid JSON array markers, try parsing the entire response
        data = JSON.parse(resData);
      } else {
        const jsonSubstring = resData.substring(jsonStart, jsonEnd);
        const parsedArray = JSON.parse(jsonSubstring);
        data = parsedArray.length > 0 ? parsedArray : resData;
      }
    } catch (parseError) {
      console.error('Error parsing dooflix response:', parseError);
      return [];
    }

    if (!Array.isArray(data)) {
      console.warn('Unexpected data format from dooflix API');
      return [];
    }

    data.forEach((result: any) => {
      const id = result?.videos_id;
      if (!id) return;

      const type = !result?.is_tvseries ? 'tvseries' : 'movie';
      const link = `${baseUrl}/rest-api//v130/single_details?type=${type}&id=${id}`;

      const thumbnailUrl = result?.thumbnail_url;
      const image = thumbnailUrl?.includes('https')
        ? thumbnailUrl
        : thumbnailUrl?.replace('http', 'https');

      catalog.push({
        title: result?.title || '',
        link,
        image,
      });
    });

    return catalog;
  } catch (err) {
    console.error('dooflix error:', err);
    return [];
  }
};

export const dooGetSearchPost = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    if (page > 1) {
      return [];
    }

    const catalog: Post[] = [];
    const baseUrl = await getBaseUrl('dooflix');
    const url = `${baseUrl}/rest-api//v130/search?q=${searchQuery}&type=movietvserieslive&range_to=0&range_from=0&tv_category_id=0&genre_id=0&country_id=0`;

    const res = await axios.get(url, {headers, signal});
    const resData = res.data;

    if (!resData || typeof resData !== 'string') {
      console.warn('Unexpected search response format from dooflix API');
      return [];
    }

    let data;
    try {
      const jsonStart = resData.indexOf('{');
      const jsonEnd = resData.lastIndexOf('}') + 1;

      if (jsonStart === -1 || jsonEnd <= jsonStart) {
        data = resData;
      } else {
        const jsonSubstring = resData.substring(jsonStart, jsonEnd);
        const parsedData = JSON.parse(jsonSubstring);
        data = parsedData?.movie ? parsedData : resData;
      }
    } catch (parseError) {
      console.error('Error parsing dooflix search response:', parseError);
      return [];
    }

    // Process movies
    data?.movie?.forEach((result: any) => {
      const id = result?.videos_id;
      if (!id) return;

      const link = `${baseUrl}/rest-api//v130/single_details?type=movie&id=${id}`;
      const thumbnailUrl = result?.thumbnail_url;
      const image = thumbnailUrl?.includes('https')
        ? thumbnailUrl
        : thumbnailUrl?.replace('http', 'https');

      catalog.push({
        title: result?.title || '',
        link,
        image,
      });
    });

    // Process TV series
    data?.tvseries?.forEach((result: any) => {
      const id = result?.videos_id;
      if (!id) return;

      const link = `${baseUrl}/rest-api//v130/single_details?type=tvseries&id=${id}`;
      const thumbnailUrl = result?.thumbnail_url;
      const image = thumbnailUrl?.includes('https')
        ? thumbnailUrl
        : thumbnailUrl?.replace('http', 'https');

      catalog.push({
        title: result?.title || '',
        link,
        image,
      });
    });

    return catalog;
  } catch (error) {
    console.error('dooflix search error:', error);
    return [];
  }
};

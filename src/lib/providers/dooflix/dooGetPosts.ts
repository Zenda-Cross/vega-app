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
    // console.log(filter);
    if (filter.includes('searchQuery=')) {
      if (page > 1) {
        return [];
      }
      const url =
        baseUrl +
        `/rest-api//v130/search?q=${filter.replace(
          'searchQuery=',
          '',
        )}&type=movietvserieslive&range_to=0&range_from=0&tv_category_id=0&genre_id=0&country_id=0`;

      console.log('search', url);
      const res = await axios.get(url, {headers, signal});
      const resData = res.data;
      const jsonStart = resData?.indexOf('{');
      const jsonEnd = resData?.lastIndexOf('}') + 1;
      const data = JSON?.parse(resData?.substring(jsonStart, jsonEnd))?.movie
        ? JSON?.parse(resData?.substring(jsonStart, jsonEnd))
        : resData;
      console.log('data🌏🌏', data);
      data?.movie?.map((result: any) => {
        const id = result?.videos_id;
        const link = `${baseUrl}/rest-api//v130/single_details?type=movie&id=${id}`;
        if (id) {
          catalog.push({
            title: result?.title,
            link: link,
            image: result?.thumbnail_url?.includes('https')
              ? result?.thumbnail_url
              : result?.thumbnail_url?.replace('http', 'https'),
          });
        }
      });

      data?.tvseries?.map((result: any) => {
        const id = result?.videos_id;
        const link = `${baseUrl}/rest-api//v130/single_details?type=tvseries&id=${id}`;
        if (id) {
          catalog.push({
            title: result?.title,
            link: link,
            image: result?.thumbnail_url?.includes('https')
              ? result?.thumbnail_url
              : result?.thumbnail_url?.replace('http', 'https'),
          });
        }
      });
      return catalog;
    } else {
      const url = `${baseUrl + filter + `?page=${page}`}`;
      //   console.log('dooflix', url);
      const res = await axios.get(url, {headers, signal});
      const resData = res.data;
      const jsonStart = resData?.indexOf('[');
      const jsonEnd = resData?.lastIndexOf(']') + 1;
      const data =
        JSON?.parse(resData?.substring(jsonStart, jsonEnd))?.length > 0
          ? JSON?.parse(resData?.substring(jsonStart, jsonEnd))
          : resData;
      //   console.log('JsonData', jsonData);
      data?.map((result: any) => {
        const id = result?.videos_id;
        const link = `${baseUrl}/rest-api//v130/single_details?type=${
          !result?.is_tvseries ? 'tvseries' : 'movie'
        }&id=${id}`;
        if (id) {
          catalog.push({
            title: result?.title,
            link: link,
            image: result?.thumbnail_url?.includes('https')
              ? result?.thumbnail_url
              : result?.thumbnail_url?.replace('http', 'https'),
          });
        }
      });
      // console.log(catalog);
      return catalog;
    }
  } catch (err) {
    console.error('dooflix error ', err);
    return [];
  }
};

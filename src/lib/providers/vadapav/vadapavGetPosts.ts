import axios from 'axios';
import * as cheerio from 'cheerio';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const vadapavGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('vadapav');
  if (page > 1) {
    return [];
  }
  const url = `${baseUrl + filter}`;
  console.log('vadapavGetPosts', url);

  return posts(baseUrl, url, signal);
};

export const vadapavGetPostsSearch = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('vadapav');
  if (page > 1) {
    return [];
  }
  const url = `${baseUrl}/s/${searchQuery}`;
  console.log('vadapavGetPosts', url);

  return posts(baseUrl, url, signal);
};

async function posts(
  baseUrl: string,
  url: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const res = await axios.get(url, {signal});
    const data = res.data;
    const $ = cheerio.load(data);
    const catalog: Post[] = [];
    $('.directory-entry:not(:contains("Parent Directory"))').map(
      (i, element) => {
        const title = $(element).text();
        const link = $(element).attr('href');
        const imageTitle =
          title?.length > 30
            ? title?.slice(0, 30)?.replaceAll('.', ' ')
            : title?.replaceAll('.', ' ');

        const image = `https://placehold.jp/23/000000/ffffff/200x400.png?text=${encodeURIComponent(
          imageTitle,
        )}&css=%7B%22background%22%3A%22%20-webkit-gradient(linear%2C%20left%20bottom%2C%20left%20top%2C%20from(%233f3b3b)%2C%20to(%23000000))%22%2C%22text-transform%22%3A%22%20capitalize%22%7D`;
        // console.log('title', image);
        if (title && link) {
          catalog.push({
            title: title,
            link: baseUrl + link,
            image: image,
          });
        }
      },
    );
    // console.log(catalog);
    return catalog;
  } catch (err) {
    console.error('vadapav error ', err);
    return [];
  }
}

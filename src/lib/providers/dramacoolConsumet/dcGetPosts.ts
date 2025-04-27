import axios from 'axios';
import {headers} from '../headers';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const dcGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  console.log('dcGetPosts', filter, page);
  const baseUrl = await getBaseUrl('consumet');
  const url = `${baseUrl}/movies/dramacool${filter}?`;
  console.log('dcUrl', url);
  return posts(url, signal);
};

export const dcGetSearchPost = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('consumet');
  const url = `${baseUrl}/movies/dramacool/${searchQuery}?page=${page}`;
  console.log('dcUrl', url); // Updated log statement
  return posts(url, signal);
};

async function posts(url: string, signal: AbortSignal): Promise<Post[]> {
  try {
    const posts: Post[] = [];
    const res = await axios.get(url, {headers, signal});
    const data = res.data;
    data?.results?.forEach((item: any) => {
      posts.push({
        image: item.image,
        link: item.id,
        title: item.title,
      });
    });
    // console.log(catalog);
    return posts;
  } catch (err) {
    console.error('dc error ', err);
    return [];
  }
}

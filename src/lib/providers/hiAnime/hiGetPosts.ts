import axios from 'axios';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const hiGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('consumet');
  const url = `${baseUrl + filter}?page=${page}`;
  // console.log(url);

  return posts(url, signal);
};

export const hiGetPostsSearch = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('consumet');
  const url = `${baseUrl}/anime/zoro/${searchQuery}?page=${page}`;
  // console.log(url);

  return posts(url, signal);
};

async function posts(url: string, signal: AbortSignal): Promise<Post[]> {
  try {
    const res = await axios.get(url, {signal});
    const data = res.data?.results;
    const catalog: Post[] = [];
    data?.map((element: any) => {
      const title = element.title;
      const link = element.id;
      const image = element.image;
      if (title && link && image) {
        catalog.push({
          title: title,
          link: link,
          image: image,
        });
      }
    });

    // console.log(catalog);
    return catalog;
  } catch (err) {
    console.error('zoro error ', err);
    return [];
  }
}

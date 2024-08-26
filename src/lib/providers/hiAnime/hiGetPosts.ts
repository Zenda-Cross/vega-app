import axios from 'axios';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const hiGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const baseUrl = await getBaseUrl('consumet');
    const url = filter.includes('searchQuery=')
      ? `${baseUrl}/anime/zoro/${filter.replace(
          'searchQuery=',
          '',
        )}?page=${page}`
      : `${baseUrl + filter}?page=${page}`;
    // console.log(url);
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
};

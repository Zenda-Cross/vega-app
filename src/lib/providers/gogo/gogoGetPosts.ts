import axios from 'axios';
import {Post} from '../types';
import {Content} from '../../zustand/contentStore';

export const gogoGetPosts = async function (
  filter: string,
  page: number,
  provider: Content['provider'],
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const baseUrl = 'https://consumet8.vercel.app';
    const url = filter.includes('searchQuery=')
      ? `${baseUrl}/anime/gogoanime/${filter.replace(
          'searchQuery=',
          '',
        )}?page=${page}`
      : `${baseUrl + filter}?page=${page}`;
    console.log(url);
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

    console.log(catalog);
    return catalog;
  } catch (err) {
    // console.error(err);
    return [];
  }
};

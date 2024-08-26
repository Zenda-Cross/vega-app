import axios from 'axios';
import {Post} from '../types';

export const gogoGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const baseUrl = 'https://private-aniwatch-api.vercel.app';
    const url = filter.includes('q=')
      ? `${baseUrl}/anime/${filter.replace(
          'q=',
          '',
        )}&page=${page}`
      : `${baseUrl + filter}&page=${page}`;
    // console.log(url);
    const res = await axios.get(url, {signal});
    const data = res.animes;
    const catalog: Post[] = [];
    data?.map((element: any) => {
      const title = element.name;
      const link = element.id;
      const image = element.poster;
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
    console.error('hianime error ', err);
    return [];
  }
};

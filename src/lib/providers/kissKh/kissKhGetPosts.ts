import axios from 'axios';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const kissKhGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const baseUrl = await getBaseUrl('kissKh');
    const url = filter.includes('searchQuery=')
      ? `${baseUrl}/anime/zoro/${filter.replace(
          'searchQuery=',
          '',
        )}?page=${page}`
      : `${baseUrl + filter}&page=${page}`;
    // console.log(url);
    const res = await axios.get(url, {signal});
    const data = res.data?.data;
    const catalog: Post[] = [];
    data?.map((element: any) => {
      const title = element.title;
      const link = baseUrl + `/api/DramaList/Drama/${element?.id}?isq=false`;
      const image = element.thumbnail;
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

import axios from 'axios';
import {Post} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const kissKhGetPosts = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('kissKh');
  const url = `${baseUrl + filter}&type=0`;
  // console.log(url);
  try {
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
    console.error('kiss error ', err);
    return [];
  }
};

export const kissKhGetPostsSearch = async function (
  searchQuery: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  const baseUrl = await getBaseUrl('kissKh');
  const url = `${baseUrl}/api/DramaList/Search?q=${searchQuery}&type=0`;
  console.log(url);
  try {
    const res = await axios.get(url, {signal});
    const data = res.data;
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
    console.error('kiss error ', err);
    return [];
  }
};

import axios from 'axios';
import {headers} from '../headers';
import {Post} from '../types';

export const guardahdGetSearchPosts = async function (
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
    const url2 = `https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURI(
      searchQuery,
    )}.json`;
    const res2 = await axios.get(url2, {headers, signal});
    const data2 = res2.data;
    data2?.metas.map((result: any) => {
      const title = result?.name || '';
      const id = result?.imdb_id || result?.id;
      const image = result?.poster;
      const type = result?.type;
      if (id) {
        catalog.push({
          title: title,
          link: `https://v3-cinemeta.strem.io/meta/${type}/${id}.json`,
          image: image,
        });
      }
    });
    return catalog;
  } catch (err) {
    console.error('AutoEmbed error ', err);
    return [];
  }
};

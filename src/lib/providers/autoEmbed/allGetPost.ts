import axios from 'axios';
import {headers} from '../headers';
import {Post} from '../types';

export const allGetPost = async function (
  filter: string,
  page: number,
  providerValue: string,
  signal: AbortSignal,
): Promise<Post[]> {
  try {
    const baseUrl = 'https://cinemeta-catalogs.strem.io';
    const catalog: Post[] = [];

    // console.log(filter);
    if (filter.includes('searchQuery=')) {
      if (page > 2) {
        return [];
      }
      const url1 = `https://v3-cinemeta.strem.io/catalog/series/top/search=${encodeURI(
        filter.replace('searchQuery=', ''),
      )}.json`;
      const url2 = `https://v3-cinemeta.strem.io/catalog/movie/top/search=${encodeURI(
        filter.replace('searchQuery=', ''),
      )}.json`;
      // console.log(url1);
      const res = await axios.get(url1, {headers, signal});
      const data = res.data;
      data?.metas.map((result: any) => {
        const title = result.name || '';
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
      // console.log('nfSearch', catalog);
      return catalog;
    } else {
      const url = `${baseUrl + filter}/skip=${(page - 1) * 50}.json`;
      // console.log(url);
      const res = await axios.get(url, {headers, signal});
      const data = res.data;

      data?.metas.map((result: any) => {
        const title = result?.name;
        const id = result?.imdb_id || result?.id;
        const type = result?.type;
        const image = result?.poster;

        if (id) {
          catalog.push({
            title: title,
            link: `https://v3-cinemeta.strem.io/meta/${type}/${id}.json`,
            image: image,
          });
        }
      });
      // console.log('catalog', catalog.length);
      return catalog;
    }
  } catch (err) {
    console.error('AutoEmbed error ', err);
    return [];
  }
};

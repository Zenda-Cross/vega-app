import axios from 'axios';
import {Info, Link} from '../types';
import {headers} from './nfHeaders';

export const nfGetInfo = async function (link: string): Promise<Info> {
  try {
    const url = link;
    console.log('nfifo', url);
    const res = await axios.get(url, {
      headers: headers,
    });
    const data = res.data;
    const id = link.split('id=')[1]?.split('&')[0];
    const meta = {
      title: data.title,
      synopsis: data.desc,
      image: `https://img.nfmirrorcdn.top/poster/h/${id}.jpg`,
      cast: data?.short_cast?.split(','),
      tags: [data?.year, data?.hdsd, ...data?.thismovieis?.split(',')],
      imdbId: '',
      type: 'series',
    };
    console.log('nfinfo', meta);

    const linkList: Link[] = [];
    if (data?.season?.length > 0) {
      data.season.map((season: any) => {
        linkList.push({
          title: 'Season ' + season?.s,
          episodesLink: season?.id,
          movieLinks: '',
          quality: '',
        });
      });
    } else {
      linkList.push({
        title: meta.title,
        episodesLink: '',
        movieLinks: link,
        quality: '',
      });
    }

    return {
      ...meta,

      linkList: linkList,
    };
  } catch (err) {
    console.error(err);
    return {
      title: '',
      synopsis: '',
      image: '',
      imdbId: '',
      type: 'movie',
      linkList: [],
    };
  }
};

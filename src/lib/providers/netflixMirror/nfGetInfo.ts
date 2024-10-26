import {Info, Link} from '../types';
import {nfGetCookie} from './nfGetCookie';

export const nfGetInfo = async function (link: string): Promise<Info> {
  try {
    const url = link;
    console.log('nfifo', url);
    const cookies = await nfGetCookie();
    const res = await fetch(url, {
      headers: {
        cookie: cookies,
      },
      credentials: 'omit',
    });
    const data = await res.json();
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
        });
      });
    } else {
      linkList.push({
        title: meta.title,
        directLinks: [{link: id, title: 'Movie', type: 'movie'}],
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
      type: '',
      linkList: [],
    };
  }
};

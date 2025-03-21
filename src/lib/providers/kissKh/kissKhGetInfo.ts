import axios from 'axios';
import {Info, Link} from '../types';

export const kissKhGetInfo = async function (link: string): Promise<Info> {
  try {
    const res = await axios.get(link);
    const data = res.data;
    const meta = {
      title: data.title,
      synopsis: data.description,
      image: data.thumbnail,
      tags: [data?.releaseDate?.split('-')[0], data?.status, data?.type],
      imdbId: '',
      type: data.episodesCount > 1 ? 'series' : 'movie',
    };

    const linkList: Link[] = [];
    const subLinks: Link['directLinks'] = [];

    data?.episodes?.map((episode: any) => {
      const title = 'Episode ' + episode?.number;
      const link = episode?.id?.toString();
      if (link && title) {
        subLinks.push({
          title,
          link,
        });
      }
    });

    linkList.push({
      title: meta.title,
      directLinks: subLinks,
    });

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

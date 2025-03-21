import axios from 'axios';
import {Info, Link} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const flixhqGetInfo = async function (id: string): Promise<Info> {
  try {
    const baseUrl = await getBaseUrl('consumet');
    const url = `${baseUrl}/movies/flixhq/info?id=` + id;
    console.log(url);
    const res = await axios.get(url);
    const data = res.data;
    const meta = {
      title: data.title,
      synopsis: data.description.replace(/<[^>]*>?/gm, '').trim(),
      image: data.cover,
      cast: data.casts,
      rating: data.rating,
      tags: [data?.type, data?.duration, data.releaseDate.split('-')[0]],
      imdbId: '',
      type: data.episodes.length > 1 ? 'series' : 'movie',
    };

    const links: Link['directLinks'] = [];
    data.episodes.forEach((episode: any) => {
      const title = episode?.number
        ? 'Season-' + episode?.season + ' Ep-' + episode.number
        : episode.title;
      const link = episode.id + '*' + data.id;
      if (link && title) {
        links.push({
          title,
          link,
        });
      }
    });

    return {
      ...meta,
      linkList: [
        {
          title: meta.title,
          directLinks: links,
        },
      ],
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

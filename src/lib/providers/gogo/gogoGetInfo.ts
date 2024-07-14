import axios from 'axios';
import {Info, EpisodeLink} from '../types';

export const gogoGetInfo = async function (link: string): Promise<Info> {
  try {
    const url = 'https://consumet8.vercel.app/anime/gogoanime/info/' + link;
    console.log(url);
    const res = await axios.get(url);
    const data = res.data;
    const meta = {
      title: data.title,
      synopsis: data.description,
      image: data.image,
      tags: [data?.subOrDub, data?.status, data?.type],
      imdbId: '',
      type: data.episodes.length > 0 ? 'series' : 'movie',
    };

    const links: EpisodeLink[] = [];
    data.episodes.forEach((episode: any) => {
      const title = 'Episode ' + episode.number;
      const link = episode.id;
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
          episodesLink: '',
          movieLinks: '',
          quality: '',
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

import axios from 'axios';
import {Info, EpisodeLink} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const hiGetInfo = async function (link: string): Promise<Info> {
  try {
    const baseUrl = await getBaseUrl('consumet');
    const url = `${baseUrl}/anime/zoro/info?id=` + link;
    console.log(url);
    const res = await axios.get(url);
    const data = res.data;
    const meta = {
      title: data.title,
      synopsis: data.description,
      image: data.image,
      tags: [
        data?.type,
        data?.subOrDub === 'both' ? 'Sub and Dub' : data?.subOrDub,
      ],
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

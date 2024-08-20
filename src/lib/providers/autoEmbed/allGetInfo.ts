import axios from 'axios';
import {EpisodeLink, Info, Link} from '../types';

export const allGetInfo = async function (link: string): Promise<Info> {
  try {
    console.log('all', link);
    const res = await axios.get(link);
    const data = res.data;
    const meta = {
      title: '',
      synopsis: '',
      image: '',
      imdbId: data?.meta?.imdb_id || '',
      type: data?.meta?.type || 'movie',
    };

    const links: Link[] = [];
    let directLinks: EpisodeLink[] = [];
    let season = new Map();
    if (meta.type === 'series') {
      data?.meta?.videos?.map((video: any) => {
        if (video?.season <= 0) return;
        if (!season.has(video?.season)) {
          season.set(video?.season, []);
        }
        season.get(video?.season).push({
          title: 'Episode ' + video?.episode,
          link: JSON.stringify({
            title: data?.meta?.name as string,
            imdbId: data?.meta?.imdb_id,
            season: video?.id?.split(':')[1],
            episode: video?.id?.split(':')[2],
            type: data?.meta?.type,
            tmdbId: data?.meta?.moviedb_id?.toString() || '',
            year: data?.meta?.year,
          }),
        });
      });
      const keys = Array.from(season.keys());
      keys.sort();
      keys.map(key => {
        directLinks = season.get(key);
        links.push({
          title: `Season ${key}`,
          movieLinks: '',
          episodesLink: '',
          quality: '',
          directLinks: directLinks,
        });
      });
    } else {
      links.push({
        title: data?.meta?.name as string,
        movieLinks: JSON.stringify({
          title: data?.meta?.name as string,
          imdbId: data?.meta?.imdb_id,
          season: '',
          episode: '',
          type: data?.meta?.type,
          tmdbId: data?.meta?.moviedb_id?.toString() || '',
          year: data?.meta?.year,
        }),
        episodesLink: '',
        quality: '',
      });
    }
    return {
      ...meta,
      linkList: links,
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

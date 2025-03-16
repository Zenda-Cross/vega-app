import axios from 'axios';
import {EpisodeLink, Info, Link} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const ridoGetInfo = async function (link: string): Promise<Info> {
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

    const baseUrl = await getBaseUrl('ridomovies');
    let slug = '';
    try {
      const res2 = await axios.get(
        baseUrl + '/core/api/search?q=' + meta.imdbId,
      );
      const data2 = res2.data;
      console.log('all', data2);
      slug = data2?.data?.items[0]?.fullSlug;
      if (!slug || meta?.type === 'series') {
        return {
          title: '',
          synopsis: '',
          image: '',
          imdbId: data?.meta?.imdb_id || '',
          type: meta?.type || 'movie',
          linkList: [],
        };
      }
    } catch (err) {
      console.error('ridoGetInfo', err);
      return {
        title: '',
        synopsis: '',
        image: '',
        imdbId: meta?.imdbId || '',
        type: meta?.type || 'movie',
        linkList: [],
      };
    }

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
          type: 'series',
          link: JSON.stringify({
            season: video?.id?.split(':')[1],
            episode: video?.id?.split(':')[2],
            type: data?.meta?.type,
            slug: slug,
            baseUrl: baseUrl,
          }),
        });
      });
      const keys = Array.from(season.keys());
      keys.sort();
      keys.map(key => {
        directLinks = season.get(key);
        links.push({
          title: `Season ${key}`,
          directLinks: directLinks,
        });
      });
    } else {
      console.log('all meta Mv🔥🔥', meta);
      links.push({
        title: data?.meta?.name as string,
        directLinks: [
          {
            title: 'Movie',
            type: 'movie',
            link: JSON.stringify({
              type: data?.meta?.type,
              slug: slug,
              baseUrl: baseUrl,
            }),
          },
        ],
      });
    }
    return {
      ...meta,
      linkList: links,
    };
  } catch (err) {
    console.error('ridoGetInfo', err);
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

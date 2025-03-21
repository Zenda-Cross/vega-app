import axios from 'axios';
import {EpisodeLink, Info, Link} from '../types';
import {headers} from './headers';

export const dooGetInfo = async function (link: string): Promise<Info> {
  try {
    // console.log('all', link);
    const res = await axios.get(link, {headers});
    const resData = res.data;
    const jsonStart = resData?.indexOf('{');
    const jsonEnd = resData?.lastIndexOf('}') + 1;
    const data = JSON?.parse(resData?.substring(jsonStart, jsonEnd))?.title
      ? JSON?.parse(resData?.substring(jsonStart, jsonEnd))
      : resData;
    // console.log('data🌏🌏', data);
    const title = data?.title || '';
    const synopsis = data?.description || '';
    const image = data?.poster_url || '';
    const cast = data?.cast || [];
    const rating = data?.imdb_rating || '';
    const type = Number(data?.is_tvseries) ? 'series' : 'movie';
    const tags = data?.genre?.map((genre: any) => genre?.name) || [];

    const links: Link[] = [];

    // console.log('data', title, synopsis, image, cast, tags, type);

    if (type === 'series') {
      data?.season?.map((season: any) => {
        const title = season?.seasons_name || '';
        const directLinks: EpisodeLink[] =
          season?.episodes?.map((episode: any) => ({
            title: episode?.episodes_name,
            link: episode?.file_url,
          })) || [];
        links.push({
          title: title,
          directLinks: directLinks,
        });
      });
    } else {
      data?.videos?.map((video: any) => {
        links.push({
          title: title + ' ' + video?.label,
          directLinks: [
            {
              title: 'Play',
              link: video?.file_url,
            },
          ],
        });
      });
    }
    console.log('links', links);
    return {
      image: image?.includes('https') ? image : image?.replace('http', 'https'),
      synopsis: synopsis,
      title: title,
      rating: rating,
      imdbId: '',
      cast: cast,
      tags: tags,
      type: type,
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

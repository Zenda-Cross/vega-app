import axios from 'axios';
import {EpisodeLink} from '../types';
import {headers} from './nfHeaders';
import {getBaseUrl} from '../getBaseUrl';

export const nfGetEpisodes = async function (
  link: string,
): Promise<EpisodeLink[]> {
  try {
    const baseUrl = await getBaseUrl('nfMirror');
    const url =
      `${baseUrl}/episodes.php?s=` +
      link +
      '&t=' +
      Math.round(new Date().getTime() / 1000);
    console.log('nfEpisodesUrl', url);
    const res = await axios.get(url, {
      headers: headers,
    });
    const data = res.data;

    const episodeList: EpisodeLink[] = [];

    data?.episodes?.map((episode: any) => {
      episodeList.push({
        title: 'Episode ' + episode?.ep.replace('E', ''),
        link: episode?.id,
      });
    });

    return episodeList;
  } catch (err) {
    console.error(err);
    return [];
  }
};

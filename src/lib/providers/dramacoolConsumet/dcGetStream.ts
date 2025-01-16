import axios from 'axios';
import {Stream} from '../types';
import {getQualityLinks} from '../../m3u8Parcer';
import {getBaseUrl} from '../getBaseUrl';

export const dcGetStream = async (id: string): Promise<Stream[]> => {
  try {
    const episodeId = id.split('*')[0];
    const mediaId = id.split('*')[1];
    const baseUrl = await getBaseUrl('consumet');
    const url = `${baseUrl}/movies/dramacool/watch?episodeId=${episodeId}&mediaId=${mediaId}`;
    console.log('dcStreamurl', url);
    const res = await axios.get(url);
    const data = res.data;
    const streamLinks: Stream[] = [];

    if (data && data.sources && data.sources.length > 0) {
      // for (const stream of data.sources) {
      const qualityLinks = await getQualityLinks(data.sources[0].url);
      qualityLinks.forEach(qualityLink => {
        streamLinks.push({
          link: qualityLink.url,
          type: 'm3u8',
          server: 'Vipdra-' + qualityLink.quality,
        });
      });
      // }
    }
    return streamLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
};

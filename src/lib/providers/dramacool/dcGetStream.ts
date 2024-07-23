import axios from 'axios';
import {Stream} from '../types';

export const dcGetStream = async (id: string): Promise<Stream[]> => {
  try {
    const episodeId = id.split('*')[0];
    const mediaId = id.split('*')[1];
    const url = `https://consumet8.vercel.app/movies/dramacool/watch?episodeId=${episodeId}&mediaId=${mediaId}`;
    console.log('dcStreamurl', url);
    const res = await axios.get(url);
    const data = res.data;
    const streamLinks: Stream[] = [];
    data.sources.forEach((source: any, index: number) => {
      streamLinks.push({
        server: 'Server ' + (index + 1),
        link: source.url,
        type: source.isM3U8 ? 'm3u8' : 'mp4',
      });
    });
    return streamLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
};

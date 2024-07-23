import axios from 'axios';
import {Stream} from '../types';

export const gogoGetStream = async (id: string): Promise<Stream[]> => {
  try {
    const url = `https://consumet8.vercel.app/anime/gogoanime/watch/${id}`;
    const res = await axios.get(url);
    const data = res.data;
    const streamLinks: Stream[] = [];
    data.sources.forEach((source: any) => {
      streamLinks.push({
        server: source.quality,
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

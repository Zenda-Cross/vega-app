import axios from 'axios';
import {Stream} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const gogoGetStream = async (id: string): Promise<Stream[]> => {
  try {
    const baseUrl = await getBaseUrl('consumet');
    const url = `${baseUrl}/anime/gogoanime/watch/${id}`;
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

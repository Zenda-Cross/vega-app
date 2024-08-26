import axios from 'axios';
import {Stream} from '../types';

export const hianimeGetStream = async (id: string): Promise<Stream[]> => {
  try {
    const url = `https://private-aniwatch-api.vercel.app/anime/episode-srcs?id=${id}`;
    const res = await axios.get(url);
    const data = res.json();
    const streamLinks: Stream[] = [];
    data.sources.forEach((source: any) => {
      streamLinks.push({
        server: source.quality || 'unknown',
        link: source.url,
        type: source.type ? 'm3u8' : 'mp4',
        subtitles: data.tracks,
      });
    });
    return streamLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
};

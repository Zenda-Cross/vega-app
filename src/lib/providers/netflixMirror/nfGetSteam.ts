import axios from 'axios';
import {Stream} from '../types';
import {headers} from './nfHeaders';

export const nfGetStream = async (id: string): Promise<Stream[]> => {
  try {
    const url = `https://iosmirror.cc/playlist.php?id=${id}&t=${Math.round(
      new Date().getTime() / 1000,
    )}`;
    const res = await axios.get(url, {
      headers: headers,
    });
    const data = res.data?.[0];
    const streamLinks: Stream[] = [];
    data?.sources.forEach((source: any) => {
      streamLinks.push({
        server: source.label,
        link: 'https://iosmirror.cc' + source.file,
        type: 'm3u8',
        headers: {
          Referer: 'https://iosmirror.cc/',
        },
      });
    });
    console.log(streamLinks);
    return streamLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
};

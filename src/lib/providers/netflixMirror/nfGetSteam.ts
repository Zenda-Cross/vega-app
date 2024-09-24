import {Stream} from '../types';
import {getNfHeaders} from './nfHeaders';
import {getBaseUrl} from '../getBaseUrl';

export const nfGetStream = async (id: string): Promise<Stream[]> => {
  try {
    const baseUrl = await getBaseUrl('nfMirror');
    const url = `${baseUrl}/playlist.php?id=${id}&t=${Math.round(
      new Date().getTime() / 1000,
    )}`;
    const headers = await getNfHeaders();
    const res = await fetch(url, {
      headers,
      credentials: 'omit',
    });
    const resJson = await res.json();
    const data = resJson?.[0];
    const streamLinks: Stream[] = [];
    data?.sources.forEach((source: any) => {
      streamLinks.push({
        server: source.label,
        link: baseUrl + source.file,
        type: 'm3u8',
        headers: {
          Referer: baseUrl,
          origin: baseUrl,
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

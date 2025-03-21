import {Stream} from '../types';
import {getBaseUrl} from '../getBaseUrl';
import {nfGetCookie} from './nfGetCookie';

export const nfGetStream = async (
  providerValue: string,
  id: string,
): Promise<Stream[]> => {
  try {
    const baseUrl = await getBaseUrl('nfMirror');
    const url = `${baseUrl}${
      providerValue === 'netflixMirror'
        ? '/playlist.php?id='
        : '/pv/playlist.php?id='
    }${id}&t=${Math.round(new Date().getTime() / 1000)}`;
    const cookies = await nfGetCookie();
    console.log('nfGetStream', cookies);
    const res = await fetch(url, {
      headers: {
        cookie:
          cookies +
          `;hd=on;ott=${providerValue === 'netflixMirror' ? 'nf' : 'pv'};`,
      },
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

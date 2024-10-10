import {getQualityLinks} from '../../m3u8Parcer';
import {Stream} from '../types';

export const animeRulzGetStream = async (link: string): Promise<Stream[]> => {
  try {
    console.log('doo link', link);
    const streams: Stream[] = [];
    const res = await fetch(link);
    const data = await res.text();
    const embededUrl = data.match(/"embedUrl":\s*"(https?:\/\/[^\s"]+)"/)?.[1];
    console.log('embededUrl', embededUrl);
    if (embededUrl && embededUrl.includes('vidstreaming')) {
      const res2 = await fetch(
        `http://192.168.37.48:3000/api/decrypt?url=${embededUrl}&passphrase=1FHuaQhhcsKgpTRB`,
      );
      const data2 = await res2.json();
      console.log('data2', data2);

      streams.push({
        server: 'vidstreaming ',
        type: 'm3u8',
        link: data2.videoUrl,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:101.0) Gecko/20100101 Firefox/101.0',
          Referer: 'https://vidstreaming.xyz/',
          Origin: 'https://vidstreaming.xyz',
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.5',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
          Pragma: 'no-cache',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return streams;
  } catch (err) {
    console.error(err);
    return [];
  }
};

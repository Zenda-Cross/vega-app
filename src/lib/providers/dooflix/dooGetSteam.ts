import {Stream} from '../types';

export const dooGetStream = async (link: string): Promise<Stream[]> => {
  try {
    const streams: Stream[] = [];
    streams.push({
      server: 'Dooflix',
      link: link,
      type: 'm3u8',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0',
        Referer: 'https://mocdn.art/',
      },
    });
    console.log('doo streams', streams);
    return streams;
  } catch (err) {
    console.error(err);
    return [];
  }
};

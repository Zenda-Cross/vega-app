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
          'MyRK3Yp5wcT49eyw6vp78Dbz4C7mT8D9eySTK2J97X7jERHigYUGuiguFTUGIYHtXGmDX89eDERTGBVYU78Z347X7jajt77jajt7kw2nd2d8Tk2D7UHtrehTKVC7d9QmTm/7.7 (Linux;Android 14) ExoPlayerLib/2.18.1',
        Referer: 'https://s1.iplckt.sbs/',
        Connection: 'keep-alive',
      },
    });
    console.log('doo streams', streams);
    return streams;
  } catch (err) {
    console.error(err);
    return [];
  }
};

import {Stream} from '../types';

export const vadapavGetStream = async (
  url: string,
  type: string,
): Promise<Stream[]> => {
  try {
    const stream: Stream[] = [];
    console.log('vadapavGetStream', type, url);
    stream.push({
      server: 'vadapav',
      link: url,
      type: url?.split('.').pop() || 'mkv',
    });

    return stream;
  } catch (err) {
    console.log('getStream error', err);
    return [];
  }
};

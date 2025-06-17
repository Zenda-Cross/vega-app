import {Stream, ProviderContext} from '../types';

export const vadapavGetStream = async function ({
  link: url, // type,
} // providerContext,
: {
  link: string;
  type: string;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  try {
    const stream: Stream[] = [];
    stream.push({
      server: 'vadapav',
      link: url,
      type: url?.split('.').pop() || 'mkv',
    });
    return stream;
  } catch (err) {
    return [];
  }
};

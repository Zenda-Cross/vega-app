import {Stream} from '../types';
import {getBaseUrl} from '../getBaseUrl';

export const nfGetStream = async (
  providerValue: string,
  id: string,
): Promise<Stream[]> => {
  try {
    const baseUrl = await getBaseUrl('nfMirror');
    const url = `https://netmirror.8man.me/api/net-proxy?url=${baseUrl}${
      providerValue === 'netflixMirror'
        ? '/playlist.php?id='
        : '/pv/playlist.php?id='
    }${id}&t=${Math.round(new Date().getTime() / 1000)}`;
    console.log('nfGetStream');
    const res = await fetch(url, {
      credentials: 'omit',
    });
    const resJson = await res.json();
    const data = resJson?.[0];
    const streamLinks: Stream[] = [];
    data?.sources.forEach((source: any) => {
      streamLinks.push({
        server: source.label,
        link: (baseUrl + source.file)?.replace(':su', ':ni'),
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

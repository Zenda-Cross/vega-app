import {TextTrackType} from 'react-native-video';
import {Stream} from '../types';
import {atob} from 'react-native-quick-base64';
import {getBaseUrl} from '../getBaseUrl';

export const suGetStream = async (
  id: string,
  type: string,
): Promise<Stream[]> => {
  try {
    console.log(id);
    const streams: Stream[] = [];
    const {imdbId, season, episode, title, tmdbId, year} = JSON.parse(id);

    const baseUrl = await getBaseUrl('embedsu');
    const link =
      type === 'movie'
        ? `${baseUrl}/embed/movie/${tmdbId}`
        : `${baseUrl}/embed/tv/${tmdbId}/${season}/${episode}`;
    console.log('su link', link);
    const res = await fetch(link, {
      headers: {
        referer: baseUrl,
      },
    });
    const text = await res.text();
    const encodedValue = text.match(/atob\(`([^`]+)`\)/)?.[1];
    // console.log('encodedValue', encodedValue);

    const decodedValue = encodedValue ? atob(encodedValue) : '';
    const decodedJson = JSON.parse(decodedValue);
    // console.log('decodedJson', decodedJson);
    const hash = getApiHash(decodedJson?.hash, decodedJson?.server);
    // console.log('hash', hash);
    if (!hash) return [];
    const streamLink = `${baseUrl}/api/e/${hash}`;
    console.log('streamJson', streamLink);
    const streamRes = await fetch(streamLink, {
      headers: {
        Referer: baseUrl,
        Origin: baseUrl,
      },
    });
    const streamJson = await streamRes.json();
    const stream = streamJson?.source;
    console.log('streamlink', stream);

    streams.push({
      server: 'Viper',
      link: stream,
      type: 'm3u8',
      headers: {
        Referer: baseUrl,
        Origin: baseUrl,
      },
      subtitles: streamJson?.subtitles?.map((sub: any) => ({
        title: sub.label,
        language: sub.label.slice(0, 3),
        type: TextTrackType.VTT,
        uri: sub.file,
      })),
    });

    return streams;
  } catch (err) {
    console.error(err);
    return [];
  }
};

function getApiHash(vConfigHash: string, serverName: string): string {
  try {
    const decoded = atob(vConfigHash)
      .split('.')
      .map(segment => segment.split('').reverse().join(''));

    const servers = JSON.parse(
      atob(decoded.join('').split('').reverse().join('')),
    );

    const server = servers.find(
      (s: any) => s.name.toLowerCase() === serverName.toLowerCase(),
    );

    return server?.hash || '';
  } catch (err) {
    console.error('getApiHash err', err);
    return '';
  }
}

import axios from 'axios';
import {getBaseUrl} from '../getBaseUrl';
import {Stream} from '../types';
import {TextTracks, TextTrackType} from 'react-native-video';

export async function getRiveStream(
  tmdId: string,
  episode: string,
  season: string,
  type: string,
  Streams: Stream[],
) {
  const secret = generateSecretKey(Number(tmdId));
  const servers = [
    'hydrax',
    'filmecho',
    'upcloud',
    'nova',
    'vidcloud',
    'ee3',
    'filmxyz',
  ];
  const baseUrl = await getBaseUrl('rive');
  const cors = 'aHR0cHM6Ly9jcnMuMXByb3h5LndvcmtlcnMuZGV2Lz91cmw9';
  const route =
    type === 'series'
      ? `/api/backendfetch?requestID=tvVideoProvider&id=${tmdId}&season=${season}&episode=${episode}&secretKey=${secret}&service=`
      : `/api/backendfetch?requestID=movieVideoProvider&id=${tmdId}&secretKey=${secret}&service=`;
  const url = atob(cors) + encodeURIComponent(baseUrl + route);
  await Promise.all(
    servers.map(async server => {
      console.log('Rive: ' + url + server);
      try {
        const res = await axios.get(url + server, {timeout: 4000});
        console.log('Rive Stream: ' + url + server);
        const subtitles: TextTracks = [];
        if (res.data?.data?.captions) {
          res.data?.data?.captions.forEach((sub: any) => {
            subtitles.push({
              language: sub?.label?.slice(0, 2) || 'Und',
              uri: sub?.file,
              title: sub?.label || 'Undefined',
              type: sub?.file?.endsWith('.vtt')
                ? TextTrackType.VTT
                : TextTrackType.SUBRIP,
            });
          });
        }
        console.log('Rive res: ', res.data?.data?.sources);
        res.data?.data?.sources.forEach((source: any) => {
          Streams.push({
            server: source?.source + '-' + source?.quality,
            link: source?.url,
            type: source?.format === 'hls' ? 'm3u8' : 'mp4',
            quality: source?.quality,
            subtitles: subtitles,
          });
        });
      } catch (e) {
        console.log(e);
      }
    }),
  );
}

// The two arrays used in key generation
const u = [
  'D0G31EK54',
  '0vwtC',
  'evM2jk',
  'KE4nt7LQxI',
  'Y6VBqEMmu',
  '0uwcxC7b',
  'X25Fcc',
  'lhwA3NQJX',
  'UFFQPgYD',
  'FGKgLaVsi',
  'q9lOrp',
  'ITrWAb',
  'DexH4FG9',
  'mF5ax0',
  'O3OHy5To',
  'VXrxDC8iVA',
  'oqJ2ncnyl',
  'YICvj9lbu6',
  'GAJGmOTC',
  'O5AYHZO',
  'FAnry5Oi',
  'UH585HY',
  'hPnHeR',
  'HnsKLNZiU',
  'dAWyV42NI',
  'WlaLe57sT',
  'qv1GGA4ZWd',
  'ajS3vkQ',
  '8dktWPYp',
  'n1DHcQWq',
  'zKScZgxbas',
  '7WP5qZrx',
  'KFSPp8W6UK',
  'ON0Gm',
  'nf3Jm',
  'eOJ49mY',
  'bAoo3v',
  'y0RraCS1TS',
  'xeUce',
  'EtuFJ63',
  'ydB3UlP3',
  'BcNhJEpwW',
  'wxn4ZoS6w',
  'Y34Jcz',
  '0v58PuP',
  'PAsuN',
  '4qvwGFL7pX',
  'bIELEk',
  'cYa7Xq',
  'IXvEKywghM',
];

const c = [
  'N',
  '1y',
  'R',
  'efH',
  'bR',
  'CY',
  'HF',
  'JL',
  '5',
  'A',
  'mh',
  '4',
  'F7g',
  'GzH',
  '7cb',
  'gfg',
  'f',
  'Q',
  '8',
  'c',
  'YP',
  'I',
  'KL',
  'CzW',
  'YTL',
  '4',
  'u',
  '3',
  'Vlg',
  '9q',
  'NzG',
  '9CK',
  'AbS',
  'jUG',
  'Fd',
  'c3S',
  'VWx',
  'wp',
  'bgx',
  'V',
  'o1H',
  'Pa',
  'yk',
  'a',
  'KJ',
  'VnV',
  'O',
  'm',
  'ihF',
  'x',
];

export function generateSecretKey(optionalId: number) {
  // Get current UTC date components
  let date = new Date();
  date.getUTCHours(); // This is called in the original code but not used
  let day = date.getUTCDate();
  let month = date.getUTCMonth();
  let year = date.getUTCFullYear();

  // Generate the key
  // If optionalId is provided, use it for the first part, otherwise use the day
  let firstPart =
    optionalId !== undefined ? c[optionalId % c.length] : c[day % c.length];

  return (
    firstPart + u[day % u.length] + u[month % u.length] + u[year % u.length]
  );
}

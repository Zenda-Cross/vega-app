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
    'fastx',
    'filmecho',
    'nova',
    'vidcloud',
    'ee3',
    'ghost',
    'asiacloud',
  ];
  const baseUrl = await getBaseUrl('rive');
  const cors = process.env.CORS_PRXY ? process.env.CORS_PRXY + '?url=' : '';
  console.log('CORS: ' + cors);
  const route =
    type === 'series'
      ? `/api/backendfetch?requestID=tvVideoProvider&id=${tmdId}&season=${season}&episode=${episode}&secretKey=${secret}&service=`
      : `/api/backendfetch?requestID=movieVideoProvider&id=${tmdId}&secretKey=${secret}&service=`;
  const url = cors + encodeURIComponent(baseUrl + route);
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

const secretChars = [
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

// Function to get secret key based on input
function generateSecretKey(id: number) {
  if (id === undefined) {
    return 'rive';
  }
  return secretChars[id % secretChars.length];
}

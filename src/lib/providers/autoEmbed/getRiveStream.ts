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
    'guru',
    'g1',
    'g2',
    'ee3',
    'ghost',
    'putafilme',
    'asiacloud',
    'shadow',
    'kage',
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

function generateSecretKey(id: number | string) {
  // Array of secret key fragments
  let l = [
    '9Y2',
    'xzL',
    '4zZZwK',
    'B3Yt3',
    'Z35YU9jLlf',
    'FyKw3pA',
    '5',
    '1aD8',
    'Jl',
    'xGr',
    '42ER1',
    'jczYB',
    '9hZ7dK9b',
    'Rqor4wJOP',
    'sL',
    'frTaH42KRz',
    '7iud',
    'sM',
    'YE7rmwUNfo',
    'uvCRS5',
    'g',
    'Dpymw189',
    '78Z1U2f',
    'edPXPbD',
    'wpTZ3',
    'DqPZ',
    '3BR',
    'vt',
    'Z4l2j',
    'nAp1Tv',
    'Z2',
    'BPNbeQoy',
    'ut7KZeQXn',
    '7QvWEHrUq',
    'EoVt',
    'xKGWHoH',
    'M0VnD',
    'uKZz',
    'CT5Sr4Qt',
    'c',
    'A6P8',
    'y2QPgB',
    'VJ',
    'c2k',
    '6pH1ABUJat',
    '5',
    'o',
    'PpjP',
    'jb2tLf29',
    'yr1zHg8Lz',
    '7opBBY',
    'EQOwB',
    'YSTIaExVc',
    'tbrfwW',
    'mV9kT14Yn',
    'ctkGj',
    'iuaMBA',
    'RFYsuG6j3r',
    'AYJ3bJv',
    'wM6OsyrU8',
  ];

  // Handle undefined input
  if (void 0 === id) {
    return 'rive';
  }

  try {
    let t, n;
    // Convert input to string
    let r = String(id);
    // Double base64 encode the input
    let i = btoa(btoa(r));

    // Different handling for non-numeric vs numeric inputs
    if (isNaN(Number(id))) {
      // For non-numeric inputs, sum the character codes
      let e = r.split('').reduce((e, t) => e + t.charCodeAt(0), 0);
      // Select array element or fallback to base64 encoded input
      t = l[e % l.length] || btoa(r);
      // Calculate insertion position
      n = Math.floor((e % i.length) / 2);
    } else {
      // For numeric inputs, use the number directly
      t = l[Number(id) % l.length] || btoa(r);
      // Calculate insertion position
      n = Math.floor((Number(id) % i.length) / 2);
    }

    // Construct the final key by inserting the selected value into the base64 string
    return i.slice(0, n) + t + i.slice(n);
  } catch (e) {
    // Return fallback value if any errors occur
    return 'topSecret';
  }
}

import axios from 'axios';
import {getBaseUrl} from '../getBaseUrl';
import {Stream} from '../types';
import {TextTracks, TextTrackType} from 'react-native-video';
import {headers} from '../headers';

export async function getRiveStream(
  tmdId: string,
  episode: string,
  season: string,
  type: string,
  Streams: Stream[],
) {
  const secret = generateSecretKey(Number(tmdId));
  const servers = [
    'flowcast',
    'shadow',
    'asiacloud',
    'anime',
    'hq',
    'ninja',
    'alpha',
    'kaze',
    'zenith',
    'cast',
    'ghost',
    'halo',
    'kinoecho',
    'ee3',
    'volt',
    'putafilme',
    'ophim',
    'kage',
  ];
  const baseUrl = await getBaseUrl('rive');
  const cors = process.env.CORS_PRXY ? process.env.CORS_PRXY + '?url=' : '';
  console.log('CORS: ' + cors);
  const route =
    type === 'series'
      ? `/api/backendfetch?requestID=tvVideoProvider&id=${tmdId}&season=${season}&episode=${episode}&secretKey=${secret}&service=`
      : `/api/backendfetch?requestID=movieVideoProvider&id=${tmdId}&secretKey=${secret}&service=`;
  const url = cors
    ? cors + encodeURIComponent(baseUrl + route)
    : baseUrl + route;
  await Promise.all(
    servers.map(async server => {
      console.log('Rive: ' + url + server);
      try {
        const res = await axios.get(url + server, {
          timeout: 4000,
          headers: headers,
        });
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
  const c = [
    'kItQgG',
    '5kOaYyTD',
    'Pzv7axaf',
    'cZbvi1dUx',
    'vUDA5Lv0rU',
    'kY9aWU',
    'ViC1',
    'sB9Z',
    'Nwrks1',
    'mqTb7mD2Dw',
    'qLmPaNCs7',
    'xcAD',
    'ip8lrJtJh',
    'Yu3I',
    'WOQU56C',
    'bUdzb',
    'NuQg4c',
    'JiuTF',
    'Wq5pQQO',
    'XVYT',
    'HZl4z8E',
    'kMMqZ1MxgQ',
    'cTvo7E',
    '3JkWzhoSy',
    'D0s2SLG3J',
    'isAG',
    'jE191vA',
    'jRoCKE',
    'coC7ciVee',
    '2XAX',
    'mCjV',
    'MzIji1krV',
    'biKBKNN6a',
    'SABuCs',
    '2Umy2ydhlq',
    'u1T3aXTrJZ',
    'HFNO3',
    'siEwTXUoMB',
    'm2nDLpso',
    'g7ft00J',
    'Ufryor',
    'fm4fmX',
    'qLmkp67',
    'WgLj2',
    'pGO5gLWy7',
    '6alkX',
    '5zSRDCA',
    'FdM8p',
    'J6fvNE2SUH',
    'XbrIULh',
  ];

  // Handle undefined input
  if (id === undefined) {
    return 'rive';
  }

  try {
    let fragment, insertPos;
    // Convert input to string
    const idStr = String(id);

    // Create a string hash function that exactly matches the original code
    /* eslint-disable no-bitwise */
    const generateStringHash = function (input: string) {
      input = String(input);
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        hash =
          (input.charCodeAt(i) + ((hash << 6) + (hash << 16) - hash)) >>> 0;
      }
      return hash.toString(16);
    };

    // Apply MurmurHash-like function exactly as in the original code
    const applyMurmurHash = function (input: string) {
      const str = String(input);
      let hash = 3735928559;
      for (let i = 0; i < str.length; i++) {
        let char = str.charCodeAt(i);
        char ^= (17 * i) & 255;
        hash =
          (73244475 * (hash = (((hash << 5) | (hash >>> 27)) >>> 0) ^ char)) >>>
          0;
      }
      hash ^= hash >>> 16;
      hash = (295559667 * hash) >>> 0;
      hash ^= hash >>> 13;
      hash = (877262033 * hash) >>> 0;
      return (hash ^= hash >>> 16).toString(16).padStart(8, '0');
    };
    /* eslint-enable no-bitwise */

    // Exactly match the website implementation
    const encodedHash = btoa(applyMurmurHash(generateStringHash(idStr)));

    // Different handling for non-numeric vs numeric inputs
    if (isNaN(Number(id))) {
      // For non-numeric inputs, sum the character codes
      const charSum = idStr
        .split('')
        .reduce((sum, char) => sum + char.charCodeAt(0), 0);
      // Select array element or fallback to base64 encoded input
      fragment = c[charSum % c.length] || btoa(idStr);
      // Calculate insertion position
      insertPos = Math.floor((charSum % encodedHash.length) / 2);
    } else {
      // For numeric inputs, use the number directly
      const numId = Number(id);
      fragment = c[numId % c.length] || btoa(idStr);
      // Calculate insertion position
      insertPos = Math.floor((numId % encodedHash.length) / 2);
    }

    // Construct the final key by inserting the selected value into the base64 string
    return (
      encodedHash.slice(0, insertPos) + fragment + encodedHash.slice(insertPos)
    );
  } catch (error) {
    // Return fallback value if any errors occur
    return 'topSecret';
  }
}

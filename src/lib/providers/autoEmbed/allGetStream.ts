import {Stream, ProviderContext, TextTrackType, TextTracks} from '../types';

export const allGetStream = async ({
  link: id,
  type,
  providerContext,
}: {
  link: string;
  type: string;
  providerContext: ProviderContext;
}): Promise<Stream[]> => {
  try {
    const streams: Stream[] = [];
    const {imdbId, season, episode, title, tmdbId, year} = JSON.parse(id);
    await getRiveStream(
      tmdbId,
      episode,
      season,
      type,
      streams,
      providerContext,
    );
    return streams;
  } catch (err) {
    console.error(err);
    return [];
  }
};

export async function getRiveStream(
  tmdId: string,
  episode: string,
  season: string,
  type: string,
  Streams: Stream[],
  providerContext: ProviderContext,
) {
  const secret = generateSecretKey(Number(tmdId));
  const servers = [
    'flowcast',
    'shadow',
    'asiacloud',
    'hindicast',
    'anime',
    'animez',
    'guard',
    'curve',
    'hq',
    'ninja',
    'alpha',
    'kaze',
    'zenesis',
    'genesis',
    'zenith',
    'ghost',
    'halo',
    'kinoecho',
    'ee3',
    'volt',
    'putafilme',
    'ophim',
    'kage',
  ];
  const baseUrl = await providerContext.getBaseUrl('rive');
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
        const res = await providerContext.axios.get(url + server, {
          timeout: 4000,
          headers: providerContext.commonHeaders,
        });
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
  // Array of secret key fragments - updated array from the new implementation
  const c = [
    'Yhv40uKAZa',
    'nn8YU4yBA',
    'uNeH',
    'ehK',
    'jT0',
    'n5G',
    '99R',
    'MvB1M',
    'DQtPCh',
    'GBRjk4k4I',
    'CzIOoa95UT',
    'BLE8s',
    'GDZlc7',
    'Fz45T',
    'JW6lWn',
    'DE3g4uw0i',
    '18KxmYizv',
    '8ji',
    'JUDdNMnZ',
    'oGpBippPgm',
    '7De8Pg',
    'Zv6',
    'VHT9TVN',
    'bYH6m',
    'aK1',
    'WcWH6jU',
    'Q47YEMi4k',
    'vRD3A',
    'CGOsfJO',
    'BLn8',
    'RgK0drv7l',
    'oPTfGCn3a',
    'MkpMDkttW9',
    'VNI1fPM',
    'XNFi6',
    '6cq',
    '4LvTksXoEI',
    '1rRa2KOZB0',
    'zoOGRb8HT2',
    'mhcXDtvz',
    'NUmexFY2Ur',
    '6BIMdvSZ',
    'Tr0zU2vjRd',
    'QPR',
    'fhOqJR',
    'R9VnFY',
    'xkZ99D6S',
    'umY7E',
    '5Ds8qyDq',
    'Cc6jy09y3',
    'yvU3iR',
    'Bg07zY',
    'GccECglg',
    'VYd',
    '6vOiXqz',
    '7xX',
    'UdRrbEzF',
    'fE6wc',
    'BUd25Rb',
    'lxq5Zum89o',
  ];

  // Handle undefined input
  if (id === undefined) {
    return 'rive';
  }

  try {
    let fragment, insertPos;
    // Convert input to string
    const idStr = String(id);

    // Updated string hash function to match the new implementation
    /* eslint-disable no-bitwise */
    const generateStringHash = function (input: string) {
      input = String(input);
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash =
          ((char + (hash << 6) + (hash << 16) - hash) ^ (char << i % 5)) >>> 0;
      }
      hash ^= hash >>> 13;
      hash = (1540483477 * hash) >>> 0;
      return (hash ^= hash >>> 15).toString(16).padStart(8, '0');
    };

    // Updated MurmurHash-like function to match the new implementation
    const applyMurmurHash = function (input: string) {
      const str = String(input);
      let hash = 3735928559 ^ str.length;
      for (let i = 0; i < str.length; i++) {
        let char = str.charCodeAt(i);
        char ^= ((i + 31) * 131) & 255;
        hash =
          (668265261 *
            (hash = (((hash << 7) | (hash >>> 25)) >>> 0) ^ char)) >>>
          0;
      }
      hash ^= hash >>> 16;
      hash = (2246822507 * hash) >>> 0;
      hash ^= hash >>> 13;
      hash = (3266489909 * hash) >>> 0;
      return (hash ^= hash >>> 16).toString(16).padStart(8, '0');
    };
    /* eslint-enable no-bitwise */

    // Generate the encoded hash using the new implementation
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

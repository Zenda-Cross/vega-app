import {Stream} from '../types';

export const dooGetStream = async (link: string): Promise<Stream[]> => {
  try {
    const streams: Stream[] = [];
    streams.push({
      server: 'Dooflix',
      link: link,
      type: 'm3u8',
      headers: {
        Connection: 'Keep-Alive',
        'User-Agent':
          'Mozilla/5.0 (WindowsNT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.37',
        Referer: 'https://molop.art/',
        Cookie:
          'cf_clearance=M2_2Hy4lKRy_ruRX3dzOgm3iho1FHe2DUC1lq28BUtI-1737377622-1.2.1.1-6R8RaH94._H2BuNuotsjTZ3fAF6cLwPII0guemu9A5Xa46lpCJPuELycojdREwoonYS2kRTYcZ9_1c4h4epi2LtDvMM9jIoOZKE9pIdWa30peM1hRMpvffTjGUCraHsJNCJez8S_QZ6XkkdP7GeQ5iwiYaI6Grp6qSJWoq0Hj8lS7EITZ1LzyrALI6iLlYjgLmgLGa1VuhORWJBN8ZxrJIZ_ba_pqbrR9fjnyToqxZ0XQaZfk1d3rZyNWoZUjI98GoAxVjnKtcBQQG6b2jYPJuMbbYraGoa54N7E7BR__7o',
      },
    });
    console.log('doo streams', streams);
    return streams;
  } catch (err) {
    console.error(err);
    return [];
  }
};

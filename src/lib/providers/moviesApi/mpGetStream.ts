import {TextTracks, TextTrackType} from 'react-native-video';
import {Stream} from '../types';
import {getBaseUrl} from '../getBaseUrl';
import * as cheerio from 'cheerio';

export const mpGetStream = async (
  id: string,
  type: string,
): Promise<Stream[]> => {
  try {
    console.log(id);
    const streams: Stream[] = [];
    const {imdbId, season, episode, title, tmdbId, year} = JSON.parse(id);
    const baseUrl = await getBaseUrl('moviesapi');
    const link =
      type === 'movie'
        ? `${baseUrl}/movie/${tmdbId}`
        : `${baseUrl}/tv/${tmdbId}-${season}-${episode}`;
    console.log('doo link', link);
    const res = await fetch(link, {
      headers: {
        referer: baseUrl,
      },
    });
    const baseData = await res.text();
    // console.log('baseData', baseData);
    const $ = cheerio.load(baseData);
    const embededUrl = $('iframe').attr('src') || '';
    console.log('embededUrl', embededUrl);

    // Fetch the content from the provided URL
    const response = await fetch(embededUrl, {
      credentials: 'omit',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:101.0) Gecko/20100101 Firefox/101.0',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Alt-Used': 'w1.moviesapi.club',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache',
        referer: baseUrl,
      },
      referrer: baseUrl,
      method: 'GET',
      mode: 'cors',
    });
    const data2 = await response.text();
    // console.log('data2', data2);

    // Extract the encrypted content
    const contents =
      data2.match(/const\s+Encrypted\s*=\s*['"]({.*})['"]/)?.[1] || '';
    console.log(contents);
    if (embededUrl) {
      const res2 = await fetch(
        'https://ext.8man.me/api/decrypt?passphrase==JV[t}{trEV=Ilh5',
        {
          method: 'POST',
          body: contents,
        },
      );
      const finalData = await res2.json();
      console.log('finaldata', finalData);
      const subtitle: TextTracks = finalData?.subtitles?.map((sub: any) => ({
        title: sub?.label || 'Unknown',
        language: sub?.label as string,
        type: sub?.file?.includes('.vtt')
          ? TextTrackType.VTT
          : TextTrackType.SUBRIP,
        uri: sub?.file,
      }));

      streams.push({
        server: 'vidstreaming ',
        type: 'm3u8',
        subtitles: subtitle,
        link: finalData?.videoUrl,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:101.0) Gecko/20100101 Firefox/101.0',
          Referer: baseUrl,
          Origin: baseUrl,
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.5',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
          Pragma: 'no-cache',
          'Cache-Control': 'no-cache',
        },
      });
    }

    return streams;
  } catch (err) {
    console.error(err);
    return [];
  }
};

import {TextTracks, TextTrackType} from 'react-native-video';
import {Stream} from '../types';

export const animeRulzGetStream = async (link: string): Promise<Stream[]> => {
  try {
    console.log('doo link', link);
    const streams: Stream[] = [];
    const res = await fetch(link);
    const data = await res.text();
    const embededUrl =
      data.match(/"embedUrl":\s*"(https?:\/\/[^\s"]+)"/)?.[1] || '';
    console.log('embededUrl', embededUrl);

    // Fetch the content from the provided URL
    const response = await fetch(embededUrl, {
      credentials: 'omit',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:101.0) Gecko/20100101 Firefox/101.0',
        Accept: '*/*',
        'Accept-Language': 'en-US,en;q=0.5',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'cross-site',
        Pragma: 'no-cache',
        'Cache-Control': 'no-cache',
      },
      referrer: 'https://vidstreaming.xyz/',
      method: 'GET',
      mode: 'cors',
    });
    const data2 = await response.text();

    // Extract the encrypted content
    const contents =
      data2.match(/const\s+Encrypted\s*=\s*['"]({.*})['"]/)?.[1] || '';
    // console.log(contents);
    if (embededUrl && embededUrl.includes('vidstreaming')) {
      const res2 = await fetch(
        'https://ext.8man.me/api/decrypt?passphrase==JV[t}{trEV=Ilh5',
        {
          method: 'POST',
          body: contents,
        },
      );
      const finalData = await res2.json();
      console.log('data2', finalData);
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
          Referer: 'https://vidstreaming.xyz/',
          Origin: 'https://vidstreaming.xyz',
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.5',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
          Pragma: 'no-cache',
          'Cache-Control': 'no-cache',
        },
      });
    } else {
      const embedBaseUrl = embededUrl.split('/').slice(0, 3).join('/');
      // console.log('embedBaseUrl', embedBaseUrl);
      // console.log('data2', data2);
      const streamId =
        data2.match(/sniff\(\s*["'][^"']+["']\s*,\s*["']([^"']+)["']/)?.[1] ||
        '';
      console.log('streamId', streamId);
      const videoUrl = `${embedBaseUrl}/m3u8/${streamId}/master.txt?s=1&lang=&cache=1`;

      console.log('videoUrl', videoUrl);

      streams.push({
        server: 'AwsStream ',
        type: 'm3u8',
        link: videoUrl,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:101.0) Gecko/20100101 Firefox/101.0',
          Referer: embededUrl,
          Origin: embedBaseUrl,
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

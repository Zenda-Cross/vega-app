import {Stream, ProviderContext, TextTrackType, TextTracks} from '../types';

export const mpGetStream = async function ({
  link: id,
  type,
  providerContext,
}: {
  link: string;
  type: string;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  try {
    const {getBaseUrl, cheerio} = providerContext;
    const streams: Stream[] = [];
    const {season, episode, tmdbId} = JSON.parse(id);
    const baseUrl = await getBaseUrl('moviesapi');
    const link =
      type === 'movie'
        ? `${baseUrl}/movie/${tmdbId}`
        : `${baseUrl}/tv/${tmdbId}-${season}-${episode}`;
    const res = await fetch(link, {
      headers: {
        referer: baseUrl,
      },
    });
    const baseData = await res.text();
    const $ = cheerio.load(baseData);
    const embededUrl = $('iframe').attr('src') || '';
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

    // Extract the encrypted content
    const contents =
      data2.match(/const\s+Encrypted\s*=\s*['"]({.*})['"]/)?.[1] || '';
    if (embededUrl) {
      const res2 = await fetch(
        'https://ext.8man.me/api/decrypt?passphrase==JV[t}{trEV=Ilh5',
        {
          method: 'POST',
          body: contents,
        },
      );
      const finalData = await res2.json();
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

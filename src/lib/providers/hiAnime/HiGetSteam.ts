import {Stream, ProviderContext, TextTracks, TextTrackType} from '../types';

export const hiGetStream = async function ({
  link: id,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  try {
    const {getBaseUrl, axios} = providerContext;
    const baseUrl = await getBaseUrl('consumet');
    const servers = ['vidcloud', 'vidstreaming'];
    const url = `${baseUrl}/anime/zoro/watch?episodeId=${id}&server=`;
    const streamLinks: Stream[] = [];
    await Promise.all(
      servers.map(async server => {
        try {
          const res = await axios.get(url + server);
          if (res.data) {
            const subtitles: TextTracks = [];
            res.data?.subtitles.forEach((sub: any) => {
              if (sub?.lang === 'Thumbnails') return;
              subtitles.push({
                language: sub?.lang?.slice(0, 2) || 'Und',
                uri: sub?.url,
                title: sub?.lang || 'Undefined',
                type: sub?.url?.endsWith('.vtt')
                  ? TextTrackType.VTT
                  : TextTrackType.SUBRIP,
              });
            });
            res.data?.sources.forEach((source: any) => {
              streamLinks.push({
                server: server,
                link: source?.url,
                type: source?.isM3U8 ? 'm3u8' : 'mp4',
                headers: {
                  Referer: 'https://megacloud.club/',
                  Origin: 'https://megacloud.club',
                },
                subtitles: subtitles,
              });
            });
          }
        } catch (e) {
          console.log(e);
        }
      }),
    );
    return streamLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
};

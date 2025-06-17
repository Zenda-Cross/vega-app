import {ProviderContext, Stream, TextTrackType} from '../types';

export const flixhqGetStream = async function ({
  link: id,
  providerContext,
}: {
  link: string;
  providerContext: ProviderContext;
}): Promise<Stream[]> {
  try {
    const {getBaseUrl} = providerContext;
    const episodeId = id.split('*')[0];
    const mediaId = id.split('*')[1];
    const baseUrl = await getBaseUrl('consumet');
    const serverUrl = `${baseUrl}/movies/flixhq/servers?episodeId=${episodeId}&mediaId=${mediaId}`;
    const res = await fetch(serverUrl);
    const servers = await res.json();
    const streamLinks: Stream[] = [];
    for (const server of servers) {
      const streamUrl =
        `${baseUrl}/movies/flixhq/watch?server=` +
        server.name +
        '&episodeId=' +
        episodeId +
        '&mediaId=' +
        mediaId;
      const streamRes = await fetch(streamUrl);
      const streamData = await streamRes.json();
      const subtitles: Stream['subtitles'] = [];
      if (streamData?.sources?.length > 0) {
        if (streamData.subtitles) {
          streamData.subtitles.forEach((sub: {lang: string; url: string}) => {
            subtitles.push({
              language: sub?.lang?.slice(0, 2) as any,
              uri: sub?.url,
              type: TextTrackType.VTT,
              title: sub?.lang,
            });
          });
        }
        streamData.sources.forEach((source: any) => {
          streamLinks.push({
            server:
              server?.name +
              '-' +
              source?.quality?.replace('auto', 'MultiQuality'),
            link: source.url,
            type: source.isM3U8 ? 'm3u8' : 'mp4',
            subtitles: subtitles,
          });
        });
      }
    }
    return streamLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
};

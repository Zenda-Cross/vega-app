import {Stream} from '../types';

export const flixhqGetStream = async (id: string): Promise<Stream[]> => {
  try {
    console.log(id);
    const episodeId = id.split('*')[0];
    const mediaId = id.split('*')[1];
    const serverUrl = `https://consumet8.vercel.app/movies/flixhq/servers?episodeId=${episodeId}&mediaId=${mediaId}`;
    console.log('serverUrl', serverUrl);
    const res = await fetch(serverUrl);
    const servers = await res.json();
    console.log('servers', servers);
    const streamLinks: Stream[] = [];
    for (const server of servers) {
      const streamUrl =
        'https://consumet8.vercel.app/movies/flixhq/watch?server=' +
        server.name +
        '&episodeId=' +
        episodeId +
        '&mediaId=' +
        mediaId;
      console.log('streamUrl', streamUrl);
      const streamRes = await fetch(streamUrl);
      const streamData = await streamRes.json();

      if (streamData?.sources?.length > 0) {
        streamLinks.push({
          server: server.name,
          link: streamData?.sources[streamData?.sources?.length - 1]?.url,
          type: streamData?.sources[streamData.sources.length - 1]?.isM3U8
            ? 'm3u8'
            : 'mp4',
          subtitles: streamData.subtitles,
        });
      }
    }
    return streamLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
};

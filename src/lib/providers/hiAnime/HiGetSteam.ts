import axios from 'axios';
import {Stream} from '../types';
import {getBaseUrl} from '../getBaseUrl';
import {TextTracks} from 'react-native-video';
import {TextTrackType} from 'react-native-video/lib/types/video';

export const hiGetStream = async (id: string): Promise<Stream[]> => {
  try {
    const baseUrl = await getBaseUrl('consumet');
    const servers = ['vidcloud', 'vidstreaming'];
    const url = `${baseUrl}/anime/zoro/watch?episodeId=${id}&server=`;
    const streamLinks: Stream[] = [];

    await Promise.all(
      servers.map(async server => {
        try {
          const res = await axios.get(url + server);
          console.log('HiAnime Stream: ' + url + server);
          if (res.data) {
            const subtitles: TextTracks = [];
            res.data?.subtitles.forEach((sub: any) => {
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
                subtitles: subtitles,
              });
            });
          }
        } catch (e) {
          console.log(e);
        }
      }),
    );

    console.log('streamLinks: ', streamLinks);
    return streamLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
};

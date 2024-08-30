import axios from 'axios';
import {Stream} from '../types';
import {getBaseUrl} from '../getBaseUrl';
import {TextTracks} from 'react-native-video';
import {TextTrackType} from 'react-native-video/lib/types/video';

export const kissKhGetStream = async (id: string): Promise<Stream[]> => {
  try {
    const streamLinks: Stream[] = [];
    const subtitles: TextTracks = [];
    const baseUrl = await getBaseUrl('kissKh');
    const streamUrl =
      baseUrl + `/api/DramaList/Episode/${id}.png?err=false&ts=&time=`;
    const res = await axios.get(streamUrl);
    const stream = res.data?.Video;

    const subUrl = baseUrl + `/api/Sub/${id}`;
    const subRes = await axios.get(subUrl);
    const subData = subRes.data;
    subData?.map((sub: any) => {
      subtitles.push({
        title: sub?.label,
        language: sub?.land,
        type: sub?.src?.includes('.vtt')
          ? TextTrackType.VTT
          : TextTrackType.SUBRIP,
        uri: sub?.src,
      });
    });

    streamLinks.push({
      server: 'kissKh',
      link: stream,
      type: 'm3u8',
      subtitles,
      headers: {
        referer: baseUrl,
      },
    });

    console.log('streamLinks: ', streamLinks);
    return streamLinks;
  } catch (err) {
    console.error(err);
    return [];
  }
};

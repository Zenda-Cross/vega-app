import axios from 'axios';
import {getBaseUrl} from '../getBaseUrl';
import {Stream} from '../types';
import {TextTracks, TextTrackType} from 'react-native-video';

export async function getRiveStream(
  tmdId: string,
  episode: string,
  season: string,
  type: string,
  Streams: Stream[],
) {
  const servers = ['vidcloud', 'upcloud'];
  const baseUrl = await getBaseUrl('rive');
  const route =
    type === 'series'
      ? `/api/backendfetch?requestID=tvVideoProvider&id=${tmdId}&season=${season}&episode=${episode}&service=`
      : `/api/backendfetch?requestID=movieVideoProvider&id=${tmdId}&service=`;
  const url = baseUrl + route;
  servers.forEach(async server => {
    // console.log('Rive: ' + url + server);
    try {
      const res = await axios.get(url + server, {timeout: 4000});
      if (res.data) {
        const subtitles: TextTracks = [];
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
        res.data?.data?.sources.forEach((source: any) => {
          Streams.push({
            server: source?.source + '-' + source?.quality,
            link: source?.url,
            type: source?.format === 'hls' ? 'm3u8' : 'mp4',
            quality: source?.quality,
            subtitles: subtitles,
          });
        });
      }
    } catch (e) {
      console.log(e);
    }
  });
}

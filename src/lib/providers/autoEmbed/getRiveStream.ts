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
  const servers = ['vidcloud', 'upcloud', 'nova'];
  const baseUrl = await getBaseUrl('rive');
  const pxy = 'aHR0cHM6Ly9jcnMuMXByb3h5LndvcmtlcnMuZGV2Lz91cmw9';
  const route =
    type === 'series'
      ? `/api/backendfetch?requestID=tvVideoProvider&id=${tmdId}&season=${season}&episode=${episode}&service=`
      : `/api/backendfetch?requestID=movieVideoProvider&id=${tmdId}&service=`;
  const url = atob(pxy) + encodeURIComponent(baseUrl + route);
  await Promise.all(
    servers.map(async server => {
      // console.log('Rive: ' + url + server);
      try {
        const res = await axios.get(url + server, {timeout: 4000});
        console.log('Rive Stream: ' + url + server);
        const subtitles: TextTracks = [];
        if (res.data?.data?.captions) {
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
        }
        res.data?.data?.sources.forEach((source: any) => {
          Streams.push({
            server: source?.source + '-' + source?.quality,
            link: source?.url,
            type: source?.format === 'hls' ? 'm3u8' : 'mp4',
            quality: source?.quality,
            subtitles: subtitles,
          });
        });
      } catch (e) {
        console.log(e);
      }
    }),
  );
}

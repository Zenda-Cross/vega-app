import {TextTracks, TextTrackType} from 'react-native-video';
import {Stream} from '../types';

export const getVidsrcCo = async (
  imdbId: string,
  season: string,
  episode: string,
  type: string,
  stream: Stream[],
) => {
  try {
    const baseUrl = 'https://player.vidsrc.co/api/server';
    const controller = new AbortController();
    const signal = controller.signal;
    setTimeout(() => {
      controller.abort();
    }, 10000); // 10 seconds timeout
    const servers = ['1', '2', '3', '4', '5'];
    const promises = servers.map(async server => {
      try {
        const filter =
          type !== 'movie'
            ? `?id=${imdbId}&sr=${server}&ss=${season}&ep=${episode}`
            : `?id=${imdbId}&sr=${server}`;
        const url = `${baseUrl}${filter}`;
        console.log('vidsrc url', url);
        const res = await fetch(url, {signal: signal});
        const data = await res.json();
        if (data?.url) {
          const subtitles: TextTracks = [];
          data?.tracks?.map((track: any) => {
            if (track?.url) {
              subtitles.push({
                language: track?.lang?.slice(0, 2) || 'Und',
                uri: track?.url,
                title: track?.lang || 'Undefined',
                type: track?.url?.includes('.srt')
                  ? TextTrackType.SUBRIP
                  : TextTrackType.VTT,
              });
            }
          });
          stream.push({
            link: data.url,
            server: 'VidsrcCo ' + server,
            type: 'mp4',
            subtitles: subtitles,
          });
        }
      } catch (e) {
        console.log('vidsrcCo error', season, episode, server, e);
      }
    });
    await Promise.all(promises);
  } catch (e) {
    console.log('getFlimxyStream error', e);
  }
};

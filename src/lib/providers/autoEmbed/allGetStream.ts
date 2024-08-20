import {TextTracks, TextTrackType} from 'react-native-video';
import {Stream} from '../types';
import {getWhvxStream} from './getWhvxStream';
import {multiExtractor} from './multiExtractor';
import {stableExtractor} from './stableExtractor';
import {getFlimxyStream} from './getFlimxyStream';

export const allGetStream = async (
  id: string,
  type: string,
): Promise<Stream[]> => {
  try {
    // console.log(id);
    const streams: Stream[] = [];
    const {imdbId, season, episode, title, tmdbId} = JSON.parse(id);

    ///// whvx
    const whvxStream = await getWhvxStream(
      imdbId,
      tmdbId,
      season,
      episode,
      title,
      type,
      'nova',
    );
    // whvx nova
    const subtitles: TextTracks = [];
    for (const caption in whvxStream?.captions) {
      subtitles.push({
        language: whvxStream?.captions?.[caption]?.language || 'Undefined',
        uri: whvxStream?.captions?.[caption]?.url,
        type:
          whvxStream?.captions?.[caption]?.type === 'srt'
            ? TextTrackType.SUBRIP
            : TextTrackType.VTT,
        title: whvxStream?.captions?.[caption]?.language || 'Undefined',
      });
    }
    for (const quality in whvxStream?.qualities) {
      streams.push({
        server: 'Nova-' + quality,
        link: whvxStream?.qualities?.[quality]?.url,
        type: whvxStream?.qualities?.[quality]?.type || 'mp4',
        subtitles: subtitles,
        quality: quality as any,
      });
    }

    // whvx orion
    const whvxStreamOrion = await getWhvxStream(
      imdbId,
      tmdbId,
      season,
      episode,
      title,
      type,
      'orion',
    );
    const subtitlesOrion: TextTracks = [];
    for (const caption in whvxStreamOrion?.captions) {
      subtitlesOrion.push({
        language: whvxStreamOrion?.captions?.[caption]?.language || 'Undefined',
        uri: whvxStreamOrion?.captions?.[caption]?.url,
        type:
          whvxStreamOrion?.captions?.[caption]?.type === 'srt'
            ? TextTrackType.SUBRIP
            : TextTrackType.VTT,
        title: whvxStreamOrion?.captions?.[caption]?.language || 'Undefined',
      });
    }
    streams.push({
      server: 'Orion',
      link: whvxStreamOrion?.playlist,
      type: whvxStreamOrion?.type === 'hls' ? 'm3u8' : 'mp4',
      subtitles: subtitlesOrion,
    });
    console.log('whvxorion', whvxStreamOrion?.playlist);

    ///// flimxy
    const flimxyStream = await getFlimxyStream(imdbId, season, episode, type);
    if (flimxyStream) {
      for (const quality in flimxyStream?.qualities) {
        streams.push({
          server: 'Flimxy-' + quality,
          link: flimxyStream?.qualities?.[quality]?.url,
          type: flimxyStream?.qualities?.[quality]?.type || 'mp4',
          quality: quality as any,
        });
      }
    }

    ///// autoembed
    // server1
    const server1Url =
      type === 'movie'
        ? `https://autoembed.cc/embed/oplayer.php?id=${imdbId}`
        : `https://autoembed.cc/embed/oplayer.php?id=${imdbId}&s=${season}&e=${episode}`;
    const links = await multiExtractor(server1Url);
    links.forEach(({lang, url}) => {
      streams.push({
        server: 'Multi' + (lang ? `-${lang}` : ''),
        link: url,
        type: 'm3u8',
      });
    });
    // server 2
    const server2Url =
      type === 'movie'
        ? `https://duka.autoembed.cc/tv/${imdbId}`
        : `https://duka.autoembed.cc/tv/${imdbId}/${season}/${episode}`;
    const links2 = await stableExtractor(server2Url);
    links2.forEach(({lang, url}) => {
      streams.push({
        server: 'Stable ' + (lang ? `-${lang}` : ''),
        link: url,
        type: 'm3u8',
      });
    });

    // server 3
    const server3Url =
      type === 'movie'
        ? `https://viet.autoembed.cc/tv/${imdbId}`
        : `https://viet.autoembed.cc/tv/${imdbId}/${season}/${episode}`;
    const links3 = await stableExtractor(server3Url);
    links3.forEach(({lang, url}) => {
      streams.push({
        server: 'Viet ' + (lang ? `-${lang}` : ''),
        link: url,
        type: 'm3u8',
      });
    });
    return streams;
  } catch (err) {
    console.error(err);
    return [];
  }
};

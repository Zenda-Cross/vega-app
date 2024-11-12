import {TextTracks, TextTrackType} from 'react-native-video';
import {Stream} from '../types';
import {getWhvxStream} from './getWhvxStream';
import {multiExtractor} from './multiExtractor';
import {stableExtractor} from './stableExtractor';
import {getFlimxyStream} from './getFlimxyStream';
import {getRiveStream} from './getRiveStream';
import {getVidSrcRip} from './getVidSrcRip';

const autoembed = 'YXV0b2VtYmVkLmNj';
export const allGetStream = async (
  id: string,
  type: string,
): Promise<Stream[]> => {
  try {
    // console.log(id);
    const streams: Stream[] = [];
    const {imdbId, season, episode, title, tmdbId, year} = JSON.parse(id);

    ///// whvx

    ///// nova
    // const whvxStream = await getWhvxStream(
    //   imdbId,
    //   tmdbId,
    //   season,
    //   episode,
    //   title,
    //   type,
    //   year,
    //   'nova',
    //   'aHR0cHM6Ly9hcGkud2h2eC5uZXQ=',
    // );
    // const subtitles: TextTracks = [];
    // for (const caption in whvxStream?.captions) {
    //   subtitles.push({
    //     language: whvxStream?.captions?.[caption]?.language || 'Undefined',
    //     uri: whvxStream?.captions?.[caption]?.url,
    //     type:
    //       whvxStream?.captions?.[caption]?.type === 'srt'
    //         ? TextTrackType.SUBRIP
    //         : TextTrackType.VTT,
    //     title: whvxStream?.captions?.[caption]?.language || 'Undefined',
    //   });
    // }
    // for (const quality in whvxStream?.qualities) {
    //   streams.push({
    //     server: 'Nova-' + quality,
    //     link: whvxStream?.qualities?.[quality]?.url,
    //     type: whvxStream?.qualities?.[quality]?.type || 'mp4',
    //     subtitles: subtitles,
    //     quality: quality as any,
    //   });
    // }

    ///// flimxy
    // const flimxyStream = await getFlimxyStream(imdbId, season, episode, type);
    // if (flimxyStream) {
    //   for (const quality in flimxyStream?.qualities) {
    //     streams.push({
    //       server: 'Flimxy-' + quality,
    //       link: flimxyStream?.qualities?.[quality]?.url,
    //       type: flimxyStream?.qualities?.[quality]?.type || 'mp4',
    //       quality: quality as any,
    //     });
    //   }
    // }

    // whvx orion
    const whvxStreamOrion = await getWhvxStream(
      imdbId,
      tmdbId,
      season,
      episode,
      title,
      type,
      year,
      'orion',
      'aHR0cHM6Ly9hcGkud2h2eC5uZXQ=',
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
    if (whvxStreamOrion?.playlist) {
      streams.push({
        server: 'Orion',
        link: whvxStreamOrion?.playlist,
        type: whvxStreamOrion?.type === 'hls' ? 'm3u8' : 'mp4',
        subtitles: subtitlesOrion,
        headers: {
          origin: atob('aHR0cHM6Ly93d3cudmlkYmluZ2UuY29t'),
        },
      });
    }
    // console.log('whvxorion', whvxStreamOrion?.playlist);

    const whvxStreamAstra = await getWhvxStream(
      imdbId,
      tmdbId,
      season,
      episode,
      title,
      type,
      year,
      'astra',
      'aHR0cHM6Ly9hcGkud2h2eC5uZXQ=',
    );
    console.log('whvxastra', whvxStreamAstra?.playlist);
    const subtitlesAstra: TextTracks = [];
    for (const caption in whvxStreamAstra?.captions) {
      subtitlesAstra.push({
        language: whvxStreamAstra?.captions?.[caption]?.language || 'Undefined',
        uri: whvxStreamAstra?.captions?.[caption]?.url,
        type:
          whvxStreamAstra?.captions?.[caption]?.type === 'srt'
            ? TextTrackType.SUBRIP
            : TextTrackType.VTT,
        title: whvxStreamAstra?.captions?.[caption]?.language || 'Undefined',
      });
    }
    if (whvxStreamAstra?.playlist) {
      streams.push({
        server: 'Astra',
        link: whvxStreamAstra?.playlist,
        type: whvxStreamAstra?.type === 'hls' ? 'm3u8' : 'mp4',
        subtitles: subtitlesAstra,
        headers: {
          origin: atob('aHR0cHM6Ly93d3cudmlkYmluZ2UuY29t'),
        },
      });
    }

    ///// nsbx
    // const nsbxStream = await getWhvxStream(
    //   imdbId,
    //   tmdbId,
    //   season,
    //   episode,
    //   title,
    //   type,
    //   year,
    //   'alpha',
    //   'aHR0cHM6Ly9uc2J4LndhZmZsZWhhY2tlci5pbw==',
    // );
    // const subtitlesNsbx: TextTracks = [];
    // for (const caption in nsbxStream?.captions) {
    //   subtitlesNsbx.push({
    //     language: nsbxStream?.captions?.[caption]?.language || 'Undefined',
    //     uri: nsbxStream?.captions?.[caption]?.url,
    //     type:
    //       nsbxStream?.captions?.[caption]?.type === 'srt'
    //         ? TextTrackType.SUBRIP
    //         : TextTrackType.VTT,
    //     title: nsbxStream?.captions?.[caption]?.language || 'Undefined',
    //   });
    // }
    // if (nsbxStream?.playlist) {
    //   streams.push({
    //     server: 'Nsbx',
    //     link: nsbxStream?.playlist,
    //     type: nsbxStream?.type === 'hls' ? 'm3u8' : 'mp4',
    //     subtitles: subtitlesNsbx,
    //     headers: {
    //       origin: atob('aHR0cHM6Ly93d3cudmlkYmluZ2UuY29t'),
    //     },
    //   });
    // }

    ///// rive
    await getRiveStream(tmdbId, episode, season, type, streams);

    ///// vidsrcrip
    // await getVidSrcRip(tmdbId, season, episode, streams);

    ///// autoembed
    // server1

    const server1Url =
      type === 'movie'
        ? `https://${atob(autoembed)}/embed/oplayer.php?id=${imdbId}`
        : `https://${atob(
            autoembed,
          )}/embed/oplayer.php?id=${imdbId}&s=${season}&e=${episode}`;
    const links = await multiExtractor(server1Url);
    links.forEach(({lang, url}) => {
      streams.push({
        server: 'Multi' + (lang ? `-${lang}` : ''),
        link: url,
        type: 'm3u8',
      });
    });

    // server 2

    // const server2Url =
    //   type === 'movie'
    //     ? `https://duka.${atob(autoembed)}/movie/${imdbId}`
    //     : `https://duka.${atob(autoembed)}/tv/${imdbId}/${season}/${episode}`;
    // const links2 = await stableExtractor(server2Url);
    // links2.forEach(({lang, url}) => {
    //   streams.push({
    //     server: 'Stable ' + (lang ? `-${lang}` : ''),
    //     link: url,
    //     type: 'm3u8',
    //   });
    // });

    // server 3

    const server3Url =
      type === 'movie'
        ? `https://viet.${atob(autoembed)}/movie/${imdbId}`
        : `https://viet.${atob(autoembed)}/tv/${imdbId}/${season}/${episode}`;
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

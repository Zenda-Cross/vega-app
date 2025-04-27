import {TextTracks, TextTrackType} from 'react-native-video';
import {Stream} from '../types';
import {getWhvxStream} from './getWhvxStream';
import {multiExtractor} from './multiExtractor';
import {stableExtractor} from './stableExtractor';
import {getFlimxyStream} from './getFlimxyStream';
import {getRiveStream} from './getRiveStream';
import {getVidSrcRip} from './getVidSrcRip';
import axios from 'axios';
import {getVidsrcCo} from './vidsrcCo';

const autoembed = 'YXV0b2VtYmVkLmNj';
export const allGetStream = async (
  id: string,
  type: string,
): Promise<Stream[]> => {
  try {
    // console.log(id);
    const streams: Stream[] = [];
    const {imdbId, season, episode, title, tmdbId, year} = JSON.parse(id);
    console.log('tmdbId🔥🔥', tmdbId);

    ///// whvx

    ///// nova
    const whvxStream = await getWhvxStream(
      imdbId,
      tmdbId,
      season,
      episode,
      title,
      type,
      year,
      'nova',
      'aHR0cHM6Ly9hcGkud2h2eC5uZXQ=',
    );
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

    /// whvx mirrors AMZN
    try {
      const response = await axios.get(
        `https://mirrors.whvx.net/scrape?title=${title}&type=${
          type === 'series' ? 'show' : 'movie'
        }&releaseYear=${
          year?.split('–')?.length > 0 ? year?.split('–')[0] : year
        }&provider=amzn&season=${season}&episode=${episode}`,
      );
      const data = response.data;
      console.log('mirrors', data);
      if (data?.stream?.[0]?.playlist) {
        streams.push({
          server: 'whvx-mirrors-amzn',
          link: data?.stream[0]?.playlist,
          type: 'm3u8',
        });
      }
    } catch (error) {
      console.error('Error fetching from mirrors:', error);
    }
    /// whvx mirrors NTFLX
    try {
      const response = await axios.get(
        `https://mirrors.whvx.net/scrape?title=${title}&type=${
          type === 'series' ? 'show' : 'movie'
        }&releaseYear=${
          year?.split('–')?.length > 0 ? year?.split('–')[0] : year
        }&provider=ntflx&season=${season}&episode=${episode}`,
      );
      const data = response.data;
      console.log('mirrors', data);
      if (data?.stream?.[0]?.playlist) {
        streams.push({
          server: 'whvx-mirrors-ntflx',
          link: data?.stream[0]?.playlist,
          type: 'm3u8',
        });
      }
    } catch (error) {
      console.error('Error fetching from mirrors:', error);
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

    ///// Vidsrcco
    await getVidsrcCo(imdbId, season, episode, type, streams);

    ///// vidsrcrip
    // await getVidSrcRip(tmdbId, season, episode, streams);

    ///// autoembed

    // disable
    // try {
    //   const server1Url =
    //     type === 'movie'
    //       ? `https://${atob(autoembed)}/embed/oplayer.php?id=${imdbId}`
    //       : `https://${atob(
    //           autoembed,
    //         )}/embed/oplayer.php?id=${imdbId}&s=${season}&e=${episode}`;
    //   const links = await multiExtractor(server1Url);
    //   links.forEach(({lang, url}) => {
    //     streams.push({
    //       server: 'Multi' + (lang ? `-${lang}` : ''),
    //       link: url,
    //       type: 'm3u8',
    //     });
    //   });

    //   // server 2

    //   // const server2Url =
    //   //   type === 'movie'
    //   //     ? `https://duka.${atob(autoembed)}/movie/${imdbId}`
    //   //     : `https://duka.${atob(autoembed)}/tv/${imdbId}/${season}/${episode}`;
    //   // const links2 = await stableExtractor(server2Url);
    //   // links2.forEach(({lang, url}) => {
    //   //   streams.push({
    //   //     server: 'Stable ' + (lang ? `-${lang}` : ''),
    //   //     link: url,
    //   //     type: 'm3u8',
    //   //   });
    //   // });

    //   // server 4

    //   const server4Url =
    //     type === 'movie'
    //       ? `https://${atob(autoembed)}/embed/player.php?id=${tmdbId}`
    //       : `https://${atob(
    //           autoembed,
    //         )}/embed/player.php?id=${tmdbId}&s=${season}&e=${episode}`;
    //   console.log(server4Url);
    //   const links4 = await multiExtractor(server4Url);
    //   links4.forEach(({lang, url}) => {
    //     streams.push({
    //       server: 'Stable ' + (lang ? `-${lang}` : ''),
    //       link: url,
    //       type: 'm3u8',
    //     });
    //   });

    //   // server 3

    //   const server3Url =
    //     type === 'movie'
    //       ? `https://viet.${atob(autoembed)}/movie/${imdbId}`
    //       : `https://viet.${atob(autoembed)}/tv/${imdbId}/${season}/${episode}`;
    //   const links3 = await stableExtractor(server3Url);
    //   links3.forEach(({lang, url}) => {
    //     streams.push({
    //       server: 'Viet ' + (lang ? `-${lang}` : ''),
    //       link: url,
    //       type: 'm3u8',
    //     });
    //   });

    //   // server 5

    //   const server5Url =
    //     type === 'movie'
    //       ? `https://tom.${atob(
    //           autoembed,
    //         )}/api/getVideoSource?type=movie&id=${tmdbId}`
    //       : `https://tom.${atob(
    //           autoembed,
    //         )}/api/getVideoSource?type=tv&id=${tmdbId}/${season}/${episode}`;
    //   try {
    //     const links5Res = await axios(server5Url, {
    //       timeout: 20000,
    //       headers: {
    //         'user-agent':
    //           'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:101.0) Gecko/20100101 Firefox/101.0',
    //         Referer: `https://${atob(autoembed)}/`,
    //       },
    //     });
    //     const links5 = links5Res.data;
    //     if (links5.videoSource) {
    //       streams.push({
    //         server: 'Tom',
    //         link: links5.videoSource,
    //         type: 'm3u8',
    //       });
    //     }
    //   } catch (err) {
    //     console.error('Tom', err);
    //   }
    // } catch (err) {
    //   console.error('Error in autoembed', err);
    // }
    return streams;
  } catch (err) {
    console.error(err);
    return [];
  }
};

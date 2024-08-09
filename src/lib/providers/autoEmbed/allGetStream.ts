import {Stream} from '../types';
import {multiExtractor} from './multiExtractor';
import {stableExtractor} from './stableExtractor';

export const allGetStream = async (
  id: string,
  type: string,
): Promise<Stream[]> => {
  try {
    console.log(id);
    const streams: Stream[] = [];
    const imdbId = id?.split(':')?.[0];
    const season = id?.split(':')?.[1];
    const episode = id?.split(':')?.[2];

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

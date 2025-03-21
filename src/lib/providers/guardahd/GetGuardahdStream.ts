import {Stream} from '../types';
import {ExtractGuardahd} from './ExtractGuardahd';

import {GetMostraguardaStream} from './GetMostraguarda';

export const GuardahdGetStream = async (
  id: string,
  type: string,
): Promise<Stream[]> => {
  try {
    console.log(id);
    const streams: Stream[] = [];
    const {imdbId, season, episode} = JSON.parse(id);

    ///// mostraguarda
    const mostraguardaStream = await GetMostraguardaStream({
      imdb: imdbId,
      type: type,
      season: season,
      episode: episode,
    });
    if (mostraguardaStream) {
      streams.push({
        server: 'Supervideo 1',
        link: mostraguardaStream,
        type: 'm3u8',
      });
    }

    const guardahdStream = await ExtractGuardahd({
      imdb: imdbId,
      type: type,
      season: season,
      episode: episode,
    });

    if (guardahdStream) {
      streams.push({
        server: 'Supervideo 2',
        link: guardahdStream,
        type: 'm3u8',
      });
    }

    return streams;
  } catch (err) {
    console.error('Error in guardahd:', err);
    return [];
  }
};

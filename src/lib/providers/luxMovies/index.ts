import {luxGetPosts} from './luxGetPosts';
import {vegaGetInfo} from '../vega/getInfo';
import {vegaGetStream} from '../vega/getStream';
import {vegaGetEpisodeLinks} from '../vega/getEpisodesLink';
import {homeList, genresList} from '../vega/catalog';
import {ProviderType} from '../../Manifest';

export const luxMovies: ProviderType = {
  catalog: homeList,
  genres: genresList,
  getInfo: vegaGetInfo,
  getPosts: luxGetPosts,
  getStream: vegaGetStream,
  nonStreamableServer: ['filepress'],
  getEpisodeLinks: vegaGetEpisodeLinks,
};

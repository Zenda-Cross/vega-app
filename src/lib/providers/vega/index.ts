import {vegaGetInfo} from './getInfo';
import {vegaGetStream} from './getStream';
import {vegaGetEpisodeLinks} from './getEpisodesLink';
import {vegaGetPosts} from './getPosts';
import {homeList, genresList} from './catalog';
import {ProviderType} from '../../Manifest';

export const vegaMovies: ProviderType = {
  catalog: homeList,
  genres: genresList,
  getInfo: vegaGetInfo,
  getPosts: vegaGetPosts,
  getStream: vegaGetStream,
  nonStreamableServer: ['filepress'],
  getEpisodeLinks: vegaGetEpisodeLinks,
};

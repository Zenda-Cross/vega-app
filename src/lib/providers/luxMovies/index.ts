import {luxGetPosts, luxGetPostsSearch} from './luxGetPosts';
import {vegaGetInfo} from '../vega/getInfo';
import {vegaGetStream} from '../vega/getStream';
import {vegaGetEpisodeLinks} from '../vega/getEpisodesLink';
import {homeList, genresList} from './luxCatalog';
import {ProviderType} from '../../Manifest';

export const luxMovies: ProviderType = {
  catalog: homeList,
  genres: genresList,
  GetMetaData: vegaGetInfo,
  GetHomePosts: luxGetPosts,
  GetStream: vegaGetStream,
  nonStreamableServer: ['filepress'],
  GetEpisodeLinks: vegaGetEpisodeLinks,
  GetSearchPosts: luxGetPostsSearch,
};

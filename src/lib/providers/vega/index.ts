import {vegaGetInfo} from './getInfo';
import {vegaGetStream} from './getStream';
import {vegaGetEpisodeLinks} from './getEpisodesLink';
import {vegaGetPosts, vegaGetPostsSearch} from './getPosts';
import {homeList, genresList} from './catalog';
import {ProviderType} from '../types';

export const vegaMovies: ProviderType = {
  catalog: homeList,
  genres: genresList,
  GetMetaData: vegaGetInfo,
  GetHomePosts: vegaGetPosts,
  GetStream: vegaGetStream,
  nonStreamableServer: ['filepress', 'hubcloud', 'HubCdn'],
  GetEpisodeLinks: vegaGetEpisodeLinks,
  GetSearchPosts: vegaGetPostsSearch,
};

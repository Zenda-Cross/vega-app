import {uhdCatalogList, uhdGenresList} from './uhCtatalog';
import {uhdGetPosts, uhdGetPostsSearch} from './uhdGetPosts';
import {uhdGetStream} from './uhdGetStream';
import {getUhdInfo} from './getUhdInfo';
import {ProviderType} from '../types';

export const uhdMovies: ProviderType = {
  catalog: uhdCatalogList,
  genres: uhdGenresList,
  GetMetaData: getUhdInfo,
  GetHomePosts: uhdGetPosts,
  GetStream: uhdGetStream,
  nonStreamableServer: ['Gdrive-Instant'],
  GetSearchPosts: uhdGetPostsSearch,
};

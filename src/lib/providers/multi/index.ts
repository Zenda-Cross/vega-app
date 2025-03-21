import {multiGenresList, multiCatalog} from './multiCatalog';
import {multiGetInfo} from './multiGetInfo';
import {multiGetPosts, multiGetPostsSearch} from './multiPosts';
import {multiGetStream} from './multiGetStream';
import {ProviderType} from '../../Manifest';

export const multiMovies: ProviderType = {
  catalog: multiCatalog,
  genres: multiGenresList,
  GetMetaData: multiGetInfo,
  GetHomePosts: multiGetPosts,
  GetStream: multiGetStream,
  GetSearchPosts: multiGetPostsSearch,
};

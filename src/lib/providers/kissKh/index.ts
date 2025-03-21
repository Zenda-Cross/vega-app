import {kisskhCatalog, kisskhGenresList} from './kissKhCatalog';
import {kissKhGetInfo} from './kissKhGetInfo';
import {kissKhGetPosts, kissKhGetPostsSearch} from './kissKhGetPosts';
import {kissKhGetStream} from './kissKhGetStream';
import {ProviderType} from '../../Manifest';

export const kissKhProvider: ProviderType = {
  catalog: kisskhCatalog,
  genres: kisskhGenresList,
  GetHomePosts: kissKhGetPosts,
  GetMetaData: kissKhGetInfo,
  GetStream: kissKhGetStream,
  GetSearchPosts: kissKhGetPostsSearch,
};

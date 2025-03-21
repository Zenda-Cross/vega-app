import {gogoGetInfo} from './gogoGetInfo';
import {gogoCatalog, gogoGenresList} from './gogoCatalog';
import {gogoGetPosts, gogoGetPostsSearch} from './gogoGetPosts';
import {gogoGetStream} from './gogoGetStream';
import {ProviderType} from '../../Manifest';

export const gogoAnime: ProviderType = {
  catalog: gogoCatalog,
  genres: gogoGenresList,
  GetMetaData: gogoGetInfo,
  GetHomePosts: gogoGetPosts,
  GetStream: gogoGetStream,
  GetSearchPosts: gogoGetPostsSearch,
};

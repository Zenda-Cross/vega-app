import {tokyoCatalogList, tokyoGenresList} from './catalog';
import {tokyoGetInfo} from './tokyoGetInfo';
import {tokyoGetPosts, tokyoGetPostsSearch} from './tokyoGetPosts';
import {tokyoGetStream} from './tokyoGetStream';
import {ProviderType} from '../../Manifest';

export const tokyoInsider: ProviderType = {
  catalog: tokyoCatalogList,
  genres: tokyoGenresList,
  GetMetaData: tokyoGetInfo,
  GetHomePosts: tokyoGetPosts,
  GetStream: tokyoGetStream,
  GetSearchPosts: tokyoGetPostsSearch,
  blurImage: true,
};

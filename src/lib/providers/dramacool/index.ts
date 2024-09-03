import {ProviderType} from '../../Manifest';
import {dcGetInfo} from './dcGetInfo';
import {dcGetPosts, dcGetSearchPost} from './dcGetPosts';
import {dcGetStream} from './dcGetStream';
import {dcCatalog, dcGenresList} from './dcCatalog';

export const dramacool: ProviderType = {
  catalog: dcCatalog,
  genres: dcGenresList,
  GetMetaData: dcGetInfo,
  GetHomePosts: dcGetPosts,
  GetStream: dcGetStream,
  GetSearchPosts: dcGetSearchPost,
};

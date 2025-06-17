import {ringzGetPosts, ringzGetPostsSearch} from './ringzGetPosts';
import {ringzGetInfo} from './ringzGetMeta';
import {ringzGenresList, ringzCatalogList} from './ringzCatalog';
import {ProviderType} from '../types';
import {ringzGetStream} from './ringzGetStream';

export const ringz: ProviderType = {
  catalog: ringzCatalogList,
  genres: ringzGenresList,
  GetMetaData: ringzGetInfo,
  GetHomePosts: ringzGetPosts,
  GetStream: ringzGetStream,
  GetSearchPosts: ringzGetPostsSearch,
};

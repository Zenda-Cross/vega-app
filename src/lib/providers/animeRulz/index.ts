import {animeRulzGetPosts, animeRulzGetPostsSearch} from './animeRulzGetPosts';
import {animeRulzGetInfo} from './animeRulzGetInfo';
import {RzCatalogList, RzGenresList} from './animeRulzCatalog';
import {ProviderType} from '../../Manifest';
import {animeRulzGetStream} from './animerulzGetStream';

export const animeRulzProvider: ProviderType = {
  catalog: RzCatalogList,
  genres: RzGenresList,
  GetHomePosts: animeRulzGetPosts,
  GetSearchPosts: animeRulzGetPostsSearch,
  GetMetaData: animeRulzGetInfo,
  GetStream: animeRulzGetStream,
};

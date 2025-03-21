import {world4uCatalogList, world4uGenresList} from './catalog';
import {world4uGetEpisodeLinks} from './world4uGetEpisodeLinks';
import {world4uGetInfo} from './world4uGetInfo';
import {world4uGetPosts, world4uGetPostsSearch} from './world4uGetPosts';
import {world4uGetStream} from './world4uGetStream';
import {ProviderType} from '../../Manifest';

export const world4u: ProviderType = {
  catalog: world4uCatalogList,
  genres: world4uGenresList,
  GetMetaData: world4uGetInfo,
  GetHomePosts: world4uGetPosts,
  GetStream: world4uGetStream,
  GetEpisodeLinks: world4uGetEpisodeLinks,
  GetSearchPosts: world4uGetPostsSearch,
};

import {aedGetInfo} from '../autoEmbedDrama/aedGetInfo';
import {dramacoolGetPosts, dramacoolGetSearchPosts} from './dramacoolGetPosts';
import {aedCatalog, aedGenresList} from '../autoEmbedDrama/aedCatalog';
import {ProviderType} from '../../Manifest';
import {dramacoolGetStream} from './dramacoolGetStream';

export const dramacool: ProviderType = {
  catalog: aedCatalog,
  genres: aedGenresList,
  GetMetaData: aedGetInfo,
  GetHomePosts: dramacoolGetPosts,
  GetStream: dramacoolGetStream,
  GetSearchPosts: dramacoolGetSearchPosts,
};

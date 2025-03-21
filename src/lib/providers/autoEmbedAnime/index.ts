import {aedCatalog, aedGenresList} from '../autoEmbedDrama/aedCatalog';
import {aeaGetPosts, aeaGetSearchPosts} from './aeaGetPosts';
import {aedGetInfo} from '../autoEmbedDrama/aedGetInfo';
import {aedGetStream} from '../autoEmbedDrama/aedGetStream';
import {ProviderType} from '../../Manifest';

export const AEAnime: ProviderType = {
  catalog: aedCatalog,
  genres: aedGenresList,
  GetMetaData: aedGetInfo,
  GetHomePosts: aeaGetPosts,
  GetStream: aedGetStream,
  GetSearchPosts: aeaGetSearchPosts,
};

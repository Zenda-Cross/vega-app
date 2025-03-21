import {aedGetInfo} from './aedGetInfo';
import {aedGetPosts, aedGetSearchPosts} from './aedGetPosts';
import {aedCatalog, aedGenresList} from './aedCatalog';
import {ProviderType} from '../../Manifest';
import {aedGetStream} from './aedGetStream';

export const autoEmbedDrama: ProviderType = {
  catalog: aedCatalog,
  genres: aedGenresList,
  GetMetaData: aedGetInfo,
  GetHomePosts: aedGetPosts,
  GetStream: aedGetStream,
  GetSearchPosts: aedGetSearchPosts,
};

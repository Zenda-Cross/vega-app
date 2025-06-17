import {ProviderType} from '../types';
import {catalogList, sbGenresList} from './sbCatalog';
import {sbGetEpisodeLinks} from './sbGetEpisodeList';
import {sbGetInfo} from './sbGetMeta';
import {sbGetPosts, sbGetPostsSearch} from './sbGetPosts';
import {sbGetStream} from './sbGetStream';

export const showBox: ProviderType = {
  catalog: catalogList,
  genres: sbGenresList,
  GetMetaData: sbGetInfo,
  GetHomePosts: sbGetPosts,
  GetStream: sbGetStream,
  GetSearchPosts: sbGetPostsSearch,
  GetEpisodeLinks: sbGetEpisodeLinks,
};

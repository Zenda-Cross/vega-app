import {hiGetInfo} from './hiGetInfo';
import {hiCatalog, hiGenresList} from './hiCatalog';
import {hiGetStream} from './HiGetSteam';
import {hiGetPosts, hiGetPostsSearch} from './hiGetPosts';
import {ProviderType} from '../../Manifest';

export const HiAnime: ProviderType = {
  catalog: hiCatalog,
  genres: hiGenresList,
  GetMetaData: hiGetInfo,
  GetHomePosts: hiGetPosts,
  GetStream: hiGetStream,
  GetSearchPosts: hiGetPostsSearch,
};

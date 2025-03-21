import {katCatalog, katGenresList} from './katCatalog';
import {katEpisodeLinks} from './katGetEpsodes';
import {katGetInfo} from './katGetInfo';
import {katGetPosts, katGetPostsSearch} from './katGetPosts';
import {katGetStream} from './katGetSteam';
import {ProviderType} from '../../Manifest';

export const katMoviesHd: ProviderType = {
  catalog: katCatalog,
  genres: katGenresList,
  GetMetaData: katGetInfo,
  GetHomePosts: katGetPosts,
  GetStream: katGetStream,
  GetEpisodeLinks: katEpisodeLinks,
  GetSearchPosts: katGetPostsSearch,
};

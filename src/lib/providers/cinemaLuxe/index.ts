import {clGenresList, clCatalog} from './clCatalog';
import {clGetInfo} from './clGetMeta';
import {clsEpisodeLinks} from './clGetEpisodes';
import {clGetPostsSearch, clGetPosts} from './clGetPosts';
import {ProviderType} from '../../Manifest';
import {clGetStream} from './clGetSteam';

export const cinemaLuxe: ProviderType = {
  catalog: clCatalog,
  genres: clGenresList,
  GetHomePosts: clGetPosts,
  GetMetaData: clGetInfo,
  GetSearchPosts: clGetPostsSearch,
  GetEpisodeLinks: clsEpisodeLinks,
  GetStream: clGetStream,
};

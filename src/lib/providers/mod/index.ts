import {modGenresList, catalogList} from './catalog';
import {modGetInfo} from './modGetInfo';
import {modGetEpisodeLinks} from './modGetEpisodesList';
import {modGetPosts, modGetPostsSearch} from './modGetPosts';
import {modGetStream} from './modGetStream';
import {ProviderType} from '../../Manifest';

export const modMovies: ProviderType = {
  catalog: catalogList,
  genres: modGenresList,
  GetMetaData: modGetInfo,
  GetHomePosts: modGetPosts,
  GetStream: modGetStream,
  GetEpisodeLinks: modGetEpisodeLinks,
  // nonStreamableServer: ['Gdrive-Instant'],
  GetSearchPosts: modGetPostsSearch,
};

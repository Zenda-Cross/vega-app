import {modGetInfo} from '../mod/modGetInfo';
import {modGetEpisodeLinks} from '../mod/modGetEpisodesList';
import {modGetStream} from '../mod/modGetStream';
import {ProviderType} from '../../Manifest';
import {topGetPosts, topGetPostsSearch} from './topGetPosts';
import {topCatalogList, topGenresList} from './topCatalog';

export const topMovies: ProviderType = {
  catalog: topCatalogList,
  genres: topGenresList,
  GetMetaData: modGetInfo,
  GetHomePosts: topGetPosts,
  GetStream: modGetStream,
  GetEpisodeLinks: modGetEpisodeLinks,
  nonStreamableServer: [],
  GetSearchPosts: topGetPostsSearch,
};

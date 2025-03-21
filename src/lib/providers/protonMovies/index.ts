import {protonGenresList, protonCatalogList} from './protonCatalog';
import {protonGetPosts, protonGetPostsSearch} from './protonGetPosts';
import {protonGetInfo} from './protonGetMeta';
import {ProviderType} from '../../Manifest';
import {protonGetStream} from './protonGetStream';

export const protonMovies: ProviderType = {
  catalog: protonCatalogList,
  genres: protonGenresList,
  GetMetaData: protonGetInfo,
  GetHomePosts: protonGetPosts,
  GetStream: protonGetStream,
  GetSearchPosts: protonGetPostsSearch,
};

import {allCatalog, allGenresList} from '../autoEmbed/allCatalog';
import {allGetInfo} from '../autoEmbed/allGetInfo';
import {allGetPost, allGetSearchPosts} from '../autoEmbed/allGetPost';
import {ProviderType} from '../../Manifest';
import {mpGetStream} from './mpGetStream';

export const moviesApi: ProviderType = {
  catalog: allCatalog,
  genres: allGenresList,
  GetMetaData: allGetInfo,
  GetHomePosts: allGetPost,
  GetStream: mpGetStream,
  GetSearchPosts: allGetSearchPosts,
};

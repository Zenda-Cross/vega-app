import {allCatalog, allGenresList} from '../autoEmbed/allCatalog';
import {allGetInfo} from '../autoEmbed/allGetInfo';
import {allGetPost, allGetSearchPosts} from '../autoEmbed/allGetPost';
import {ProviderType} from '../../Manifest';
import {suGetStream} from './suGetSteam';

export const embedsu: ProviderType = {
  catalog: allCatalog,
  genres: allGenresList,
  GetMetaData: allGetInfo,
  GetHomePosts: allGetPost,
  GetStream: suGetStream,
  GetSearchPosts: allGetSearchPosts,
};

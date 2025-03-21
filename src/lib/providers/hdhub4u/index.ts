import {hdhub4uCatalog, hdhub4uGenresList} from './hdhubCatalog';
import {hdhub4uGetInfo} from './hdhubGetInfo';
import {hdhub4uGetStream} from './hdhub4uGetSteam';
import {hdhubGetPosts, hdhubGetPostsSearch} from './hdhubGetPosts';
import {ProviderType} from '../../Manifest';

export const hdhub4uProvider: ProviderType = {
  catalog: hdhub4uCatalog,
  genres: hdhub4uGenresList,
  GetMetaData: hdhub4uGetInfo,
  GetStream: hdhub4uGetStream,
  GetHomePosts: hdhubGetPosts,
  GetSearchPosts: hdhubGetPostsSearch,
};

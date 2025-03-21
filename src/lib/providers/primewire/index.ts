import {pwCatalogList, pwGenresList} from './pwCatalogl';
import {pwGetPosts, pwGetPostsSearch} from './pwGetPosts';
import {pwGetInfo} from './pwGetInfo';
import {pwGetStream} from './pwGetStream';
import {ProviderType} from '../../Manifest';

export const primewire: ProviderType = {
  catalog: pwCatalogList,
  genres: pwGenresList,
  GetMetaData: pwGetInfo,
  GetHomePosts: pwGetPosts,
  GetStream: pwGetStream,
  GetSearchPosts: pwGetPostsSearch,
};

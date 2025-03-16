import {allCatalog, allGenresList} from './allCatalog';
import {allGetInfo} from './allGetInfo';
import {allGetStream} from './allGetStream';
import {allGetPost, allGetSearchPosts} from './allGetPost';
import {ProviderType} from '../../Manifest';

export const autoEmbed: ProviderType = {
  catalog: allCatalog,
  genres: allGenresList,
  GetMetaData: allGetInfo,
  GetHomePosts: allGetPost,
  GetStream: allGetStream,
  GetSearchPosts: allGetSearchPosts,
};

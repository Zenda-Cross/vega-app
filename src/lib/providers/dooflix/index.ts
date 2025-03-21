import {ProviderType} from '../../Manifest';
import {dooCatalog, dooGenresList} from './dooCatalog';
import {dooGetInfo} from './dooGetInfo';
import {dooGetPost, dooGetSearchPost} from './dooGetPosts';
import {dooGetStream} from './dooGetSteam';

export const dooflixProvider: ProviderType = {
  catalog: dooCatalog,
  genres: dooGenresList,
  GetMetaData: dooGetInfo,
  GetStream: dooGetStream,
  GetHomePosts: dooGetPost,
  GetSearchPosts: dooGetSearchPost,
};

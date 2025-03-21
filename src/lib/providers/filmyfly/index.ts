import {ProviderType} from '../../Manifest';
import {ffCatalog, ffGenresList} from './ffCatalog';
import {ffEpisodeLinks} from './ffGetEpisodes';
import {ffGetInfo} from './ffGetMeta';
import {ffGetPosts, ffGetPostsSearch} from './ffGetPosts';
import {ffGetStream} from './ffGetStream';

export const filmyfly: ProviderType = {
  catalog: ffCatalog,
  genres: ffGenresList,
  GetHomePosts: ffGetPosts,
  GetMetaData: ffGetInfo,
  GetSearchPosts: ffGetPostsSearch,
  GetEpisodeLinks: ffEpisodeLinks,
  GetStream: ffGetStream,
};

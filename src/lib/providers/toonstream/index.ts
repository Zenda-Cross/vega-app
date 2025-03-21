import {ProviderType} from '../../Manifest';
import {toonCatalog, toonGenresList} from './toonCatalog';
import {toonGetInfo} from './toonGetInfo';
import {toonGetPosts, toonGetPostsSearch} from './toonGetPosts';
import {toonGetEpisodeLinks} from './toonGetEpisodes';

export const toonstream: ProviderType = {
  catalog: toonCatalog,
  genres: toonGenresList,
  GetMetaData: toonGetInfo,
  GetHomePosts: toonGetPosts,
  GetStream: toonGetInfo,
  GetSearchPosts: toonGetPostsSearch,
  GetEpisodeLinks: toonGetEpisodeLinks,
};

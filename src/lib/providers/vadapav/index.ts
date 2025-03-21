import {vadapavGetPosts, vadapavGetPostsSearch} from './vadapavGetPosts';
import {vadapavCatalogList, vadapavGenresList} from './VagapavCatalog';
import {ProviderType} from '../../Manifest';
import {vadapavGetInfo} from './vadapavGetInfo';
import {vadapavGetStream} from './vadapavGetStream';
import {vadapavGetEpisodeLinks} from './vadapavGetEpisodes';

export const vadapavProvider: ProviderType = {
  catalog: vadapavCatalogList,
  genres: vadapavGenresList,
  GetHomePosts: vadapavGetPosts,
  GetEpisodeLinks: vadapavGetEpisodeLinks,
  GetMetaData: vadapavGetInfo,
  GetStream: vadapavGetStream,
  GetSearchPosts: vadapavGetPostsSearch,
};

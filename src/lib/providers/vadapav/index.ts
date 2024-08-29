import {vadapavGetPosts} from './vadapavGetPosts';
import {vadapavCatalogList, vadapavGenresList} from './VagapavCatalog';
import {ProviderType} from '../../Manifest';
import {vadapavGetInfo} from './vadapavGetInfo';
import {vadapavGetStream} from './vadapavGetStream';
import {vadapavGetEpisodeLinks} from './vadapavGetEpisodes';

export const vadapavProvider: ProviderType = {
  catalog: vadapavCatalogList,
  genres: vadapavGenresList,
  getPosts: vadapavGetPosts,
  getEpisodeLinks: vadapavGetEpisodeLinks,
  getInfo: vadapavGetInfo,
  getStream: vadapavGetStream,
};

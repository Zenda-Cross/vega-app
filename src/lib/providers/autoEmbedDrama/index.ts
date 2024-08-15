import {aedGetInfo} from './aedGetInfo';
import {aedGetPosts} from './aedGetPosts';
import {aedCatalog, aedGenresList} from './aedCatalog';
import {ProviderType} from '../../Manifest';
import {aedGetStream} from './aedGetStream';

export const autoEmbedDrama: ProviderType = {
  catalog: aedCatalog,
  genres: aedGenresList,
  getEpisodeLinks: () => Promise.resolve([]),
  getInfo: aedGetInfo,
  getPosts: aedGetPosts,
  getStream: aedGetStream,
};

import {aedCatalog, aedGenresList} from '../autoEmbedDrama/aedCatalog';
import {aeaGetPosts} from './aeaGetPosts';
import {aedGetInfo} from '../autoEmbedDrama/aedGetInfo';
import {aedGetStream} from '../autoEmbedDrama/aedGetStream';
import {ProviderType} from '../../Manifest';

export const AEAnime: ProviderType = {
  catalog: aedCatalog,
  genres: aedGenresList,
  getEpisodeLinks: () => Promise.resolve([]),
  getInfo: aedGetInfo,
  getPosts: aeaGetPosts,
  getStream: aedGetStream,
};

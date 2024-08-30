import {kisskhCatalog, kisskhGenresList} from './kissKhCatalog';
import {kissKhGetInfo} from './kissKhGetInfo';
import {kissKhGetPosts} from './kissKhGetPosts';
import {kissKhGetStream} from './kissKhGetStream';
import {ProviderType} from '../../Manifest';

export const kissKhProvider: ProviderType = {
  catalog: kisskhCatalog,
  genres: kisskhGenresList,
  getPosts: kissKhGetPosts,
  getInfo: kissKhGetInfo,
  getStream: kissKhGetStream,
  getEpisodeLinks: async () => [],
};

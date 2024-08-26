import {multiGenresList, multiCatalog} from './multiCatalog';
import {multiGetInfo} from './multiGetInfo';
import {multiGetPosts} from './multiPosts';
import {multiGetStream} from './multiGetStream';
import {ProviderType} from '../../Manifest';

export const multiMovies: ProviderType = {
  catalog: multiCatalog,
  genres: multiGenresList,
  getInfo: multiGetInfo,
  getPosts: multiGetPosts,
  getStream: multiGetStream,
  getEpisodeLinks: () => Promise.resolve([]),
};

import {uhdCatalogList, uhdGenresList} from './uhCtatalog';
import {uhdGetPosts} from './uhdGetPosts';
import {uhdGetStream} from './uhdGetStream';
import {getUhdInfo} from './getUhdInfo';
import {ProviderType} from '../../Manifest';

export const uhdMovies: ProviderType = {
  catalog: uhdCatalogList,
  genres: uhdGenresList,
  getInfo: getUhdInfo,
  getPosts: uhdGetPosts,
  getStream: uhdGetStream,
  getEpisodeLinks: () => Promise.resolve([]),
  nonStreamableServer: ['Gdrive-Instant'],
};

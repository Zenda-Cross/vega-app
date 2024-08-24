import {gogoGetInfo} from './gogoGetInfo';
import {gogoCatalog, gogoGenresList} from './gogoCatalog';
import {gogoGetPosts} from './gogoGetPosts';
import {gogoGetStream} from './gogoGetStream';
import {ProviderType} from '../../Manifest';

export const gogoAnime: ProviderType = {
  catalog: gogoCatalog,
  genres: gogoGenresList,
  getInfo: gogoGetInfo,
  getPosts: gogoGetPosts,
  getStream: gogoGetStream,
  getEpisodeLinks: () => Promise.resolve([]),
};

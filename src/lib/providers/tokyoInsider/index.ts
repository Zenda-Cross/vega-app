import {tokyoCatalogList, tokyoGenresList} from './catalog';
import {tokyoGetInfo} from './tokyoGetInfo';
import {tokyoGetPosts} from './tokyoGetPosts';
import {tokyoGetStream} from './tokyoGetStream';
import {ProviderType} from '../../Manifest';

export const tokyoInsider: ProviderType = {
  catalog: tokyoCatalogList,
  genres: tokyoGenresList,
  getInfo: tokyoGetInfo,
  getPosts: tokyoGetPosts,
  getStream: tokyoGetStream,
  getEpisodeLinks: () => Promise.resolve([]),
};

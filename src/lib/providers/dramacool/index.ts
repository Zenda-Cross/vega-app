import {ProviderType} from '../../Manifest';
import {dcGetInfo} from './dcGetInfo';
import {dcGetPosts} from './dcGetPosts';
import {dcGetStream} from './dcGetStream';
import {dcCatalog, dcGenresList} from './dcCatalog';

export const dramacool: ProviderType = {
  catalog: dcCatalog,
  genres: dcGenresList,
  getInfo: dcGetInfo,
  getPosts: dcGetPosts,
  getStream: dcGetStream,
  getEpisodeLinks: () => Promise.resolve([]),
};

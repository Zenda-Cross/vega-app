import {pwCatalogList, pwGenresList} from './pwCatalogl';
import {pwGetPosts} from './pwGetPosts';
import {pwGetInfo} from './pwGetInfo';
import {pwGetStream} from './pwGetStream';
import {ProviderType} from '../../Manifest';

export const primewire: ProviderType = {
  catalog: pwCatalogList,
  genres: pwGenresList,
  getInfo: pwGetInfo,
  getPosts: pwGetPosts,
  getStream: pwGetStream,
  getEpisodeLinks: () => Promise.resolve([]),
};

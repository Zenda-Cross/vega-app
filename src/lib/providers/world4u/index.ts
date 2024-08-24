import {world4uCatalogList, world4uGenresList} from './catalog';
import {world4uGetEpisodeLinks} from './world4uGetEpisodeLinks';
import {world4uGetInfo} from './world4uGetInfo';
import {world4uGetPosts} from './world4uGetPosts';
import {world4uGetStream} from './world4uGetStream';
import {ProviderType} from '../../Manifest';

export const world4u: ProviderType = {
  catalog: world4uCatalogList,
  genres: world4uGenresList,
  getInfo: world4uGetInfo,
  getPosts: world4uGetPosts,
  getStream: world4uGetStream,
  getEpisodeLinks: world4uGetEpisodeLinks,
};

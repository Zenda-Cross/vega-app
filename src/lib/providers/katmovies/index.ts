import {katCatalog, katGenresList} from './katCatalog';
import {katEpisodeLinks} from './katGetEpsodes';
import {katGetInfo} from './katGetInfo';
import {katGetPosts} from './katGetPosts';
import {katGetStream} from './katGetSteam';
import {ProviderType} from '../../Manifest';

export const katMoviesHd: ProviderType = {
  catalog: katCatalog,
  genres: katGenresList,
  getInfo: katGetInfo,
  getPosts: katGetPosts,
  getStream: katGetStream,
  getEpisodeLinks: katEpisodeLinks,
};

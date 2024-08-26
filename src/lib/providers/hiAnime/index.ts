import {hiGetInfo} from './hiGetInfo';
import {hiCatalog, hiGenresList} from './hiCatalog';
import {hiGetStream} from './HiGetSteam';
import {hiGetPosts} from './hiGetPosts';
import {ProviderType} from '../../Manifest';

export const HiAnime: ProviderType = {
  catalog: hiCatalog,
  genres: hiGenresList,
  getInfo: hiGetInfo,
  getPosts: hiGetPosts,
  getStream: hiGetStream,
  getEpisodeLinks: async () => [],
};

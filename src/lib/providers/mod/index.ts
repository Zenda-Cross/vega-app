import {modGenresList, catalogList} from './catalog';
import {modGetInfo} from './modGetInfo';
import {modGetEpisodeLinks} from './modGetEpisodesList';
import {modGetPosts} from './modGetPosts';
import {modGetStream} from './modGetStream';
import {ProviderType} from '../../Manifest';

export const modMovies: ProviderType = {
  catalog: catalogList,
  genres: modGenresList,
  getInfo: modGetInfo,
  getPosts: modGetPosts,
  getStream: modGetStream,
  getEpisodeLinks: modGetEpisodeLinks,
  nonStreamableServer: ['Gdrive-Instant'],
};

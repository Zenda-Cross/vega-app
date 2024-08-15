import {ProviderType} from '../../Manifest';
import {dooCatalog, dooGenresList} from './dooCatalog';
import {dooGetInfo} from './dooGetInfo';
import {dooGetPost} from './dooGetPosts';
import {dooGetStream} from './dooGetSteam';

export const dooflixProvider: ProviderType = {
  catalog: dooCatalog,
  genres: dooGenresList,
  getInfo: dooGetInfo,
  getStream: dooGetStream,
  getEpisodeLinks: () => Promise.resolve([]),
  getPosts: dooGetPost,
};

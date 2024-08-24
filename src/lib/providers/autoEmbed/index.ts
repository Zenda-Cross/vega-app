import {allCatalog, allGenresList} from './allCatalog';
import {allGetInfo} from './allGetInfo';
import {allGetStream} from './allGetStream';
import {allGetPost} from './allGetPost';
import {ProviderType} from '../../Manifest';

export const autoEmbed: ProviderType = {
  catalog: allCatalog,
  genres: allGenresList,
  getInfo: allGetInfo,
  getPosts: allGetPost,
  getStream: allGetStream,
  getEpisodeLinks: () => Promise.resolve([]),
};

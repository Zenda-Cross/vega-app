import {nfCatalog, nfGenresList} from './nfCatalog';
import {nfGetInfo} from './nfGetInfo';
import {nfGetPost} from './nfGetPost';
import {nfGetEpisodes} from './nfGetEpisodes';
import {nfGetStream} from './nfGetSteam';
import {ProviderType} from '../../Manifest';

export const netflixMirror: ProviderType = {
  catalog: nfCatalog,
  genres: nfGenresList,
  getInfo: nfGetInfo,
  getPosts: nfGetPost,
  getStream: nfGetStream,
  getEpisodeLinks: nfGetEpisodes,
};

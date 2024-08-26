import {ExtraGenresList, ExtraCatalogList} from './extraCatalog';
import {ExtraGetPosts} from './extraGetPosts';
import {extraGetInfo} from './extraGetInfo';
import {extraGetStream} from './extraGetStream';
import {extraGetEpisodeLinks} from './extraGetEpisodeLinks';
import {ProviderType} from '../../Manifest';

export const extraMovies: ProviderType = {
  catalog: ExtraCatalogList,
  genres: ExtraGenresList,
  getInfo: extraGetInfo,
  getPosts: ExtraGetPosts,
  getStream: extraGetStream,
  getEpisodeLinks: extraGetEpisodeLinks,
};

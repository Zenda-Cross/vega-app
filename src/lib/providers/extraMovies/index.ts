import {ExtraGenresList, ExtraCatalogList} from './extraCatalog';
import {ExtraGetPosts, ExtraGetSearchPost} from './extraGetPosts';
import {extraGetInfo} from './extraGetInfo';
import {extraGetStream} from './extraGetStream';
import {extraGetEpisodeLinks} from './extraGetEpisodeLinks';
import {ProviderType} from '../../Manifest';

export const extraMovies: ProviderType = {
  catalog: ExtraCatalogList,
  genres: ExtraGenresList,
  GetMetaData: extraGetInfo,
  GetHomePosts: ExtraGetPosts,
  GetStream: extraGetStream,
  GetEpisodeLinks: extraGetEpisodeLinks,
  GetSearchPosts: ExtraGetSearchPost,
};

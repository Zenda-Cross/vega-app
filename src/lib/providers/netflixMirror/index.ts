import {nfCatalog, nfGenresList} from './nfCatalog';
import {nfGetInfo} from './nfGetInfo';
import {nfGetPost, nfGetPostsSearch} from './nfGetPost';
import {nfGetEpisodes} from './nfGetEpisodes';
import {nfGetStream} from './nfGetSteam';
import {ProviderType} from '../types';

export const netflixMirror: ProviderType = {
  catalog: nfCatalog,
  genres: nfGenresList,
  GetMetaData: nfGetInfo,
  GetHomePosts: nfGetPost,
  GetStream: nfGetStream,
  GetEpisodeLinks: nfGetEpisodes,
  GetSearchPosts: nfGetPostsSearch,
};

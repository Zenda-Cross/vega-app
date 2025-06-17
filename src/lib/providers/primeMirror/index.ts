import {nfCatalog, nfGenresList} from '../netflixMirror/nfCatalog';
import {nfGetPost, nfGetPostsSearch} from '../netflixMirror/nfGetPost';
import {ProviderType} from '../types';
import {pmGetInfo} from './pmGetInfo';
import {pmGetStream} from './pmGetStream';
import {pmGetEpisodes} from './pmGetEpisodes';

export const primeMirror: ProviderType = {
  catalog: nfCatalog,
  genres: nfGenresList,
  GetMetaData: pmGetInfo,
  GetHomePosts: nfGetPost,
  GetStream: pmGetStream,
  GetEpisodeLinks: pmGetEpisodes,
  GetSearchPosts: nfGetPostsSearch,
};

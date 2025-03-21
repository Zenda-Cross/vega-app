import {nfCatalog, nfGenresList} from './nfCatalog';
import {nfGetInfo} from './nfGetInfo';
import {nfGetPost, nfGetPostsSearch} from './nfGetPost';
import {nfGetEpisodes} from './nfGetEpisodes';
import {nfGetStream} from './nfGetSteam';
import {ProviderType} from '../../Manifest';

export const netflixMirror: ProviderType = {
  catalog: nfCatalog,
  genres: nfGenresList,
  GetMetaData: (link: string) => nfGetInfo('netflixMirror', link),
  GetHomePosts: nfGetPost,
  GetStream: (id: string) => nfGetStream('netflixMirror', id),
  GetEpisodeLinks: (link: string) => nfGetEpisodes('netflixMirror', link),
  GetSearchPosts: nfGetPostsSearch,
};

import {nfCatalog, nfGenresList} from '../netflixMirror/nfCatalog';
import {nfGetInfo} from '../netflixMirror/nfGetInfo';
import {nfGetPost, nfGetPostsSearch} from '../netflixMirror/nfGetPost';
import {nfGetEpisodes} from '../netflixMirror/nfGetEpisodes';
import {ProviderType} from '../../Manifest';
import {nfGetStream} from '../netflixMirror/nfGetSteam';

export const primeMirror: ProviderType = {
  catalog: nfCatalog,
  genres: nfGenresList,
  GetMetaData: (link: string) => nfGetInfo('primeMirror', link),
  GetHomePosts: nfGetPost,
  GetStream: (id: string) => nfGetStream('primeMirror', id),
  GetEpisodeLinks: (link: string) => nfGetEpisodes('primeMirror', link),
  GetSearchPosts: nfGetPostsSearch,
};

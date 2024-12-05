import {ProviderType} from '../../Manifest';
import {guardahdCatalog, guardahdGenresList} from '../guardahd/guardahdCatalog';
import {allGetPost, allGetSearchPosts} from '../autoEmbed/allGetPost';
import {ridoGetInfo} from './ridoGetMeta';
import {ridoGetStream} from './ridoGetSream';

export const ridoMovies: ProviderType = {
  catalog: guardahdCatalog,
  genres: guardahdGenresList,
  GetMetaData: ridoGetInfo,
  GetHomePosts: allGetPost,
  GetStream: ridoGetStream,
  GetSearchPosts: allGetSearchPosts,
};

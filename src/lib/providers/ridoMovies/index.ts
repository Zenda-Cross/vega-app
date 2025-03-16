import {ProviderType} from '../../Manifest';
import {guardahdCatalog, guardahdGenresList} from '../guardahd/guardahdCatalog';
import {allGetPost} from '../autoEmbed/allGetPost';
import {guardahdGetSearchPosts} from '../guardahd/guardahdGetPosts';
import {ridoGetInfo} from './ridoGetMeta';
import {ridoGetStream} from './ridoGetSream';

export const ridoMovies: ProviderType = {
  catalog: guardahdCatalog,
  genres: guardahdGenresList,
  GetMetaData: ridoGetInfo,
  GetHomePosts: allGetPost,
  GetStream: ridoGetStream,
  GetSearchPosts: guardahdGetSearchPosts,
};

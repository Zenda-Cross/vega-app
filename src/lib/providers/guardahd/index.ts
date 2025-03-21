import {guardahdCatalog, guardahdGenresList} from './guardahdCatalog';
import {allGetInfo} from '../autoEmbed/allGetInfo';
import {allGetPost} from '../autoEmbed/allGetPost';
import {guardahdGetSearchPosts} from './guardahdGetPosts';
import {ProviderType} from '../../Manifest';
import {GuardahdGetStream} from './GetGuardahdStream';

export const guardahd: ProviderType = {
  catalog: guardahdCatalog,
  genres: guardahdGenresList,
  GetMetaData: allGetInfo,
  GetHomePosts: allGetPost,
  GetStream: GuardahdGetStream,
  GetSearchPosts: guardahdGetSearchPosts,
};

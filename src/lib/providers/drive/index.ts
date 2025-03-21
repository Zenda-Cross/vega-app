import {ProviderType} from '../../Manifest';
import {driveCatalog, driveGenresList} from './catalog';
import {driveGetEpisodeLinks} from './driveGetEpisodesList';
import {driveGetInfo} from './driveGetInfo';
import {driveGetPosts, driveGetSearchPost} from './driveGetPosts';
import {driveGetStream} from './driveGetStream';

export const moviesDrive: ProviderType = {
  catalog: driveCatalog,
  genres: driveGenresList,
  GetMetaData: driveGetInfo,
  GetHomePosts: driveGetPosts,
  GetStream: driveGetStream,
  GetEpisodeLinks: driveGetEpisodeLinks,
  GetSearchPosts: driveGetSearchPost,
};

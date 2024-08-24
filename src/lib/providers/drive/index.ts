import {ProviderType} from '../../Manifest';
import {driveCatalog, driveGenresList} from './catalog';
import {driveGetEpisodeLinks} from './driveGetEpisodesList';
import {driveGetInfo} from './driveGetInfo';
import {driveGetPosts} from './driveGetPosts';
import {driveGetStream} from './driveGetStream';

export const moviesDrive: ProviderType = {
  catalog: driveCatalog,
  genres: driveGenresList,
  getInfo: driveGetInfo,
  getPosts: driveGetPosts,
  getStream: driveGetStream,
  getEpisodeLinks: driveGetEpisodeLinks,
};

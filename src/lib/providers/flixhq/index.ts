import {ProviderType} from '../../Manifest';
import {flixhqCatalog, flixhqGenresList} from './flixhqCatalog';
import {flixhqGetInfo} from './flixhqGetInfo';
import {flixhqGetPosts, flixhqGetSearchPost} from './flixhqGetPosts';
import {flixhqGetStream} from './flixhqGetStream';

export const flixhq: ProviderType = {
  catalog: flixhqCatalog,
  genres: flixhqGenresList,
  GetMetaData: flixhqGetInfo,
  GetHomePosts: flixhqGetPosts,
  GetStream: flixhqGetStream,
  GetSearchPosts: flixhqGetSearchPost,
  nonDownloadableServer: ['upcloud-MultiQuality', 'vidcloud-MultiQuality'],
  nonStreamableServer: [
    'upcloud-1080',
    'upcloud-720',
    'upcloud-480',
    'upcloud-360',
    'vidcloud-1080',
    'vidcloud-720',
    'vidcloud-480',
    'vidcloud-360',
  ],
};

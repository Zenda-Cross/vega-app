import {vegaGetInfo} from './providers/vega/getInfo';
import {vegaGetEpisodeLinks} from './providers/vega/getEpisodesLink';
import {vegaGetPosts} from './providers/vega/getPosts';
import {vegaGetStream} from './providers/vega/getStream';
import {Post, Stream, Info, EpisodeLink, Catalog} from './providers/types';
import {Content} from './zustand/contentStore';
import {modGetPosts} from './providers/mod/modGetPosts';
import {genresList, homeList} from './providers/vega/catalog';
import {catalogList, modGenresList} from './providers/mod/catalog';
import {modGetInfo} from './providers/mod/modGetInfo';
import {modGetEpisodeLinks} from './providers/mod/modGetEpisodesList';
import {modGetStream} from './providers/mod/modGetStream';
import {uhdCatalogList} from './providers/uhd/uhCtatalog';
import {uhdGetPosts} from './providers/uhd/uhdGetPosts';
import getUhdInfo from './providers/uhd/getUhdInfo';
import {uhdGetStream} from './providers/uhd/uhdGetStream';
import {tokyoGetPosts} from './providers/tokyoInsider/tokyoGetPosts';
import {tokyoCatalogList} from './providers/tokyoInsider/catalog';
import {tokyoGetInfo} from './providers/tokyoInsider/tokyoGetInfo';
import {tokyoGetStream} from './providers/tokyoInsider/tokyoGetStream';
import {driveCatalog} from './providers/drive/catalog';
import {driveGetPosts} from './providers/drive/driveGetPosts';
import {driveGetInfo} from './providers/drive/driveGetInfo';
import {driveGetEpisodeLinks} from './providers/drive/driveGetEpisodesList';
import {driveGetStream} from './providers/drive/driveGetStream';
import {multiCatalog} from './providers/multi/multiCatalog';
import {multiGetPosts} from './providers/multi/multiPosts';
import {multiGetInfo} from './providers/multi/multiGetInfo';
import {multiGetStream} from './providers/multi/multiGetStream';

interface Manifest {
  [key: string]: {
    searchFilter?: string;
    catalog: Catalog[];
    genres: Catalog[];
    blurImage?: boolean;
    nonStreamableServer?: string[];
    getStream: (link: string, type: string) => Promise<Stream[]>;
    getPosts: (
      filter: string,
      page: number,
      provider: Content['provider'],
      signal: AbortSignal,
    ) => Promise<Post[]>;
    getEpisodeLinks: (url: string) => Promise<EpisodeLink[]>;
    getInfo: (link: string, provider: Content['provider']) => Promise<Info>;
  };
}
export const manifest: Manifest = {
  vega: {
    searchFilter: 'search',
    catalog: homeList,
    genres: genresList,
    nonStreamableServer: ['filepress', 'hubcloud'],
    getStream: vegaGetStream,
    getPosts: vegaGetPosts,
    getEpisodeLinks: vegaGetEpisodeLinks,
    getInfo: vegaGetInfo,
  },
  lux: {
    catalog: homeList,
    genres: genresList,
    nonStreamableServer: ['filepress', 'hubcloud'],
    getStream: vegaGetStream,
    getPosts: vegaGetPosts,
    getEpisodeLinks: vegaGetEpisodeLinks,
    getInfo: vegaGetInfo,
  },
  mod: {
    catalog: catalogList,
    genres: modGenresList,
    nonStreamableServer: ['Gdrive-Instant'],
    getPosts: modGetPosts,
    getEpisodeLinks: modGetEpisodeLinks,
    getInfo: modGetInfo,
    getStream: modGetStream,
  },
  uhd: {
    catalog: uhdCatalogList,
    genres: [],
    blurImage: true,
    nonStreamableServer: ['Gdrive-Instant'],
    getStream: uhdGetStream,
    getPosts: uhdGetPosts,
    getEpisodeLinks: vegaGetEpisodeLinks,
    getInfo: getUhdInfo,
  },
  tokyoInsider: {
    catalog: tokyoCatalogList,
    genres: [],
    searchFilter: 'query',
    blurImage: true,
    getStream: tokyoGetStream,
    getPosts: tokyoGetPosts,
    getEpisodeLinks: vegaGetEpisodeLinks,
    getInfo: tokyoGetInfo,
  },
  drive: {
    catalog: driveCatalog,
    genres: [],
    nonStreamableServer: ['hubcloud'],
    getStream: driveGetStream,
    getPosts: driveGetPosts,
    getEpisodeLinks: driveGetEpisodeLinks,
    getInfo: driveGetInfo,
  },
  multi: {
    catalog: multiCatalog,
    genres: [],
    getPosts: multiGetPosts,
    getInfo: multiGetInfo,
    getStream: multiGetStream,
    getEpisodeLinks: vegaGetEpisodeLinks,
  },
};

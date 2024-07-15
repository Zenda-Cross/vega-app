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
import {driveCatalog, driveGenresList} from './providers/drive/catalog';
import {driveGetPosts} from './providers/drive/driveGetPosts';
import {driveGetInfo} from './providers/drive/driveGetInfo';
import {driveGetEpisodeLinks} from './providers/drive/driveGetEpisodesList';
import {driveGetStream} from './providers/drive/driveGetStream';
import {multiCatalog, multiGenresList} from './providers/multi/multiCatalog';
import {multiGetPosts} from './providers/multi/multiPosts';
import {multiGetInfo} from './providers/multi/multiGetInfo';
import {multiGetStream} from './providers/multi/multiGetStream';
import {
  world4uCatalogList,
  world4uGenresList,
} from './providers/world4u/catalog';
import {world4uGetPosts} from './providers/world4u/world4uGetPosts';
import {world4uGetInfo} from './providers/world4u/world4uGetInfo';
import {world4uGetEpisodeLinks} from './providers/world4u/world4uGetEpisodeLinks';
import {world4uGetStream} from './providers/world4u/world4uGetStream';
import {
  ExtraCatalogList,
  ExtraGenresList,
} from './providers/extraMovies/extraCatalog';
import {ExtraGetPosts} from './providers/extraMovies/extraGetPosts';
import {extraGetInfo} from './providers/extraMovies/extraGetInfo';
import {extraGetEpisodeLinks} from './providers/extraMovies/extraGetEpisodeLinks';
import {extraGetStream} from './providers/extraMovies/extraGetStream';
import {gogoCatalog, gogoGenresList} from './providers/gogo/gogoCatalog';
import {gogoGetPosts} from './providers/gogo/gogoGetPosts';
import {gogoGetInfo} from './providers/gogo/gogoGetInfo';
import {gogoGetStream} from './providers/gogo/gogoGetStream';

interface Manifest {
  [key: string]: {
    searchFilter?: string;
    catalog: Catalog[];
    genres: Catalog[];
    blurImage?: boolean;
    nonStreamableServer?: string[];
    nonDownloadableServer?: string[];
    getStream: (
      link: string,
      type: string,
      signal: AbortSignal,
    ) => Promise<Stream[]>;
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
    catalog: homeList,
    genres: genresList,
    nonStreamableServer: ['filepress'],
    getStream: vegaGetStream,
    getPosts: vegaGetPosts,
    getEpisodeLinks: vegaGetEpisodeLinks,
    getInfo: vegaGetInfo,
  },
  lux: {
    catalog: homeList,
    genres: genresList,
    nonStreamableServer: ['filepress'],
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
    blurImage: true,
    getStream: tokyoGetStream,
    getPosts: tokyoGetPosts,
    getEpisodeLinks: vegaGetEpisodeLinks,
    getInfo: tokyoGetInfo,
  },
  drive: {
    catalog: driveCatalog,
    genres: driveGenresList,
    nonStreamableServer: [],
    getStream: driveGetStream,
    getPosts: driveGetPosts,
    getEpisodeLinks: driveGetEpisodeLinks,
    getInfo: driveGetInfo,
  },
  multi: {
    catalog: multiCatalog,
    genres: multiGenresList,
    getPosts: multiGetPosts,
    getInfo: multiGetInfo,
    getStream: multiGetStream,
    nonDownloadableServer: ['multi'],
    getEpisodeLinks: vegaGetEpisodeLinks,
  },
  world4u: {
    catalog: world4uCatalogList,
    genres: world4uGenresList,
    getStream: world4uGetStream,
    getPosts: world4uGetPosts,
    getInfo: world4uGetInfo,
    getEpisodeLinks: world4uGetEpisodeLinks,
  },
  extraMovies: {
    catalog: ExtraCatalogList,
    genres: ExtraGenresList,
    getStream: extraGetStream,
    getPosts: ExtraGetPosts,
    getEpisodeLinks: extraGetEpisodeLinks,
    getInfo: extraGetInfo,
  },
  gogo: {
    catalog: gogoCatalog,
    genres: gogoGenresList,
    nonDownloadableServer: ['default', 'backup'],
    getPosts: gogoGetPosts,
    getEpisodeLinks: vegaGetEpisodeLinks,
    getInfo: gogoGetInfo,
    getStream: gogoGetStream,
  },
};

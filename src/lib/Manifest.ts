// vega and lux
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
import {vegaGetBaseurl} from './providers/vega/vegaGetBaseurl';
import {modGetBaseurl} from './providers/mod/modGetBaseurl';

interface Manifest {
  [key: string]: {
    searchFilter?: string;
    catalog: Catalog[];
    genres: Catalog[];
    getBaseURL: (providerValue: string) => Promise<string>;
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
    getBaseURL: vegaGetBaseurl,
    getStream: vegaGetStream,
    getPosts: vegaGetPosts,
    getEpisodeLinks: vegaGetEpisodeLinks,
    getInfo: vegaGetInfo,
  },
  lux: {
    searchFilter: 'search',
    catalog: homeList,
    genres: genresList,
    getBaseURL: vegaGetBaseurl,
    getStream: vegaGetStream,
    getPosts: vegaGetPosts,
    getEpisodeLinks: vegaGetEpisodeLinks,
    getInfo: vegaGetInfo,
  },
  mod: {
    searchFilter: 'search',
    catalog: catalogList,
    genres: modGenresList,
    getBaseURL: modGetBaseurl,
    getPosts: modGetPosts,
    getEpisodeLinks: modGetEpisodeLinks,
    getInfo: modGetInfo,
    getStream: modGetStream,
  },
};

import {Post, Stream, Info, EpisodeLink, Catalog} from './providers/types';
import {Content} from './zustand/contentStore';

/// Providers
import {dooflixProvider} from './providers/dooflix';
import {autoEmbedDrama} from './providers/autoEmbedDrama';
import {AEAnime} from './providers/autoEmbedAnime';
import {dramacoolConsumet} from './providers/dramacoolConsumet';
import {vegaMovies} from './providers/vega';
import {luxMovies} from './providers/luxMovies';
import {modMovies} from './providers/mod';
import {uhdMovies} from './providers/uhd';
import {tokyoInsider} from './providers/tokyoInsider';
import {moviesDrive} from './providers/drive';
import {multiMovies} from './providers/multi';
import {world4u} from './providers/world4u';
import {extraMovies} from './providers/extraMovies';
import {gogoAnime} from './providers/gogo';
import {flixhq} from './providers/flixhq';
import {hdhub4uProvider} from './providers/hdhub4u';
import {katMoviesHd} from './providers/katmovies';
import {primewire} from './providers/primewire';
import {autoEmbed} from './providers/autoEmbed';
import {HiAnime} from './providers/hiAnime';
import {vadapavProvider} from './providers/vadapav';
import {netflixMirror} from './providers/netflixMirror';
import {kissKhProvider} from './providers/kissKh';
import {cinemaLuxe} from './providers/cinemaLuxe';
import {animeRulzProvider} from './providers/animeRulz';
import {moviesApi} from './providers/moviesApi';
import {guardahd} from './providers/guardahd';
import {toonstream} from './providers/toonstream';
import {ridoMovies} from './providers/ridoMovies';
import {protonMovies} from './providers/protonMovies';
import {dramacool} from './providers/dramacool';
import {ringz} from './providers/ringz';
import {topMovies} from './providers/topmovies';

export interface ProviderType {
  searchFilter?: string;
  catalog: Catalog[];
  genres: Catalog[];
  blurImage?: boolean;
  nonStreamableServer?: string[];
  nonDownloadableServer?: string[];
  GetStream: (
    link: string,
    type: string,
    signal: AbortSignal,
  ) => Promise<Stream[]>;
  GetHomePosts: (
    filter: string,
    page: number,
    provider: string,
    signal: AbortSignal,
  ) => Promise<Post[]>;
  GetEpisodeLinks?: (url: string) => Promise<EpisodeLink[]>;
  GetMetaData: (link: string, provider: Content['provider']) => Promise<Info>;
  GetSearchPosts: (
    searchQuery: string,
    page: number,
    provider: string,
    signal: AbortSignal,
  ) => Promise<Post[]>;
}
export interface Manifest {
  [key: string]: ProviderType;
}

export const manifest: Manifest = {
  vega: vegaMovies,
  lux: luxMovies,
  mod: modMovies,
  uhd: uhdMovies,
  tokyoInsider: tokyoInsider,
  drive: moviesDrive,
  multi: multiMovies,
  world4u: world4u,
  extraMovies: extraMovies,
  gogo: gogoAnime,
  flixhq: flixhq,
  dramaCool: dramacool,
  hdhub4u: hdhub4uProvider,
  katmovies: katMoviesHd,
  primewire: primewire,
  netflixMirror: netflixMirror,
  autoEmbed: autoEmbed,
  multiStream: autoEmbed,
  dooflix: dooflixProvider,
  AEDrama: autoEmbedDrama,
  AEAnime: AEAnime,
  hiAnime: HiAnime,
  vadapav: vadapavProvider,
  kissKh: kissKhProvider,
  cinemaLuxe: cinemaLuxe,
  animeRulz: animeRulzProvider,
  moviesApi: moviesApi,
  guardahd: guardahd,
  toonstream: toonstream,
  ridoMovies: ridoMovies,
  protonMovies: protonMovies,
  ringz: ringz,
  topMovies: topMovies,
};

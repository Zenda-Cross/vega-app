/// Providers
import {dooflixProvider} from './providers/dooflix';
// import {dramacool} from './providers/dramacool';
import {vegaMovies} from './providers/vega';
import {luxMovies} from './providers/luxMovies';
import {modMovies} from './providers/mod';
import {uhdMovies} from './providers/uhd';
import {tokyoInsider} from './providers/tokyoInsider';
import {moviesDrive} from './providers/drive';
import {multiMovies} from './providers/multi';
import {world4u} from './providers/world4u';
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
import {moviesApi} from './providers/moviesApi';
import {guardahd} from './providers/guardahd';
import {ridoMovies} from './providers/ridoMovies';
import {protonMovies} from './providers/protonMovies';
import {ringz} from './providers/ringz';
import {topMovies} from './providers/topmovies';
import {primeMirror} from './providers/primeMirror';
import {filmyfly} from './providers/filmyfly';
import {showBox} from './providers/showbox';
import {ProviderType} from './providers/types';

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
  flixhq: flixhq,
  hdhub4u: hdhub4uProvider,
  katmovies: katMoviesHd,
  primewire: primewire,
  netflixMirror: netflixMirror,
  autoEmbed: autoEmbed,
  multiStream: autoEmbed,
  dooflix: dooflixProvider,
  hiAnime: HiAnime,
  vadapav: vadapavProvider,
  kissKh: kissKhProvider,
  cinemaLuxe: cinemaLuxe,
  moviesApi: moviesApi,
  guardahd: guardahd,
  ridoMovies: ridoMovies,
  protonMovies: protonMovies,
  ringz: ringz,
  topMovies: topMovies,
  primeMirror: primeMirror,
  filmyfly: filmyfly,
  showBox: showBox,
};

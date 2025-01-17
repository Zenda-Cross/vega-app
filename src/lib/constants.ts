import RNFS from 'react-native-fs';

export interface ProvidersList {
  name: string;
  value: string;
  type: string;
  flag: string;
}

const FLAGS = {
  GLOBAL: 'https://utfs.io/f/ImOWJajUmXfyRKHTpylsELpB6QlYA4OdG9Jfr3hagoCN5Mzt',
  INDIA: 'https://utfs.io/f/ImOWJajUmXfyYCEwdELCDZIMxNG5H27Bouwvb4fyVJrdqj3X',
  ENGLISH: 'https://utfs.io/f/ImOWJajUmXfyN1E0dlnILrEMR3DJQX7OUvixCSHp6YWGNVPc',
  ITALY: 'https://utfs.io/f/ImOWJajUmXfynpGlTaXrTMAELcs2W76PyY4IRJVBXCHOofa5',
};
export const providersList: ProvidersList[] = [
  {
    name: 'VegaMovies',
    value: 'vega',
    type: 'global',
    flag: FLAGS.GLOBAL,
  },
  {
    name: 'MultiStream',
    value: 'multiStream',
    type: 'global',
    flag: FLAGS.GLOBAL,
  },
  {
    name: 'MoviesDrive',
    value: 'drive',
    type: 'global',
    flag: FLAGS.GLOBAL,
  },
  {
    name: 'MultiMovies',
    value: 'multi',
    type: 'global',
    flag: FLAGS.GLOBAL,
  },
  {
    name: 'World4uFree',
    value: 'world4u',
    type: 'global',
    flag: FLAGS.GLOBAL,
  },
  // {
  //   name: 'KatMoviesHd',
  //   value: 'katmovies',
  //   type: 'global',
  //   flag: FLAGS.GLOBAL,
  // },
  {
    name: 'MoviesMod',
    value: 'mod',
    type: 'global',
    flag: FLAGS.GLOBAL,
  },
  {
    name: 'UHDMovies',
    value: 'uhd',
    type: 'global',
    flag: FLAGS.GLOBAL,
  },
  {
    name: 'ProtonMovies',
    value: 'protonMovies',
    type: 'global',
    flag: FLAGS.GLOBAL,
  },
  {
    name: 'CinemaLuxe',
    value: 'cinemaLuxe',
    type: 'global',
    flag: FLAGS.GLOBAL,
  },
  {
    name: 'Ringz',
    value: 'ringz',
    type: 'global',
    flag: FLAGS.GLOBAL,
  },
  {
    name: 'NetflixMirror',
    value: 'netflixMirror',
    type: 'global',
    flag: FLAGS.GLOBAL,
  },
  {
    name: 'HdHub4u',
    value: 'hdhub4u',
    type: 'global',
    flag: FLAGS.GLOBAL,
  },
  {
    name: 'ExtraMovies',
    value: 'extraMovies',
    type: 'global',
    flag: FLAGS.GLOBAL,
  },
  {
    name: 'VadaPav',
    value: 'vadapav',
    type: 'global',
    flag: FLAGS.GLOBAL,
  },
  // {
  //   name: 'AnimeRulz',
  //   value: 'animeRulz',
  //   type: 'global',
  //   flag: FLAGS.GLOBAL,
  // },
  // {
  //   name: 'ToonStream',
  //   value: 'toonstream',
  //   type: 'global',
  //   flag: FLAGS.GLOBAL,
  // },
  // {
  //   name: 'MoviesApi',
  //   value: 'moviesApi',
  //   type: 'english',
  //   flag: FLAGS.ENGLISH,
  // },
  {
    name: 'RidoMovies',
    value: 'ridoMovies',
    type: 'english',
    flag: FLAGS.ENGLISH,
  },
  {
    name: 'FlixHQ',
    value: 'flixhq',
    type: 'english',
    flag: FLAGS.ENGLISH,
  },
  {
    name: 'Primewire',
    value: 'primewire',
    type: 'english',
    flag: FLAGS.ENGLISH,
  },
  {
    name: 'HiAnime',
    value: 'hiAnime',
    type: 'english',
    flag: FLAGS.ENGLISH,
  },
  {
    name: 'GogoAnime',
    value: 'gogo',
    type: 'english',
    flag: FLAGS.ENGLISH,
  },
  // {
  //   name: 'AE Anime',
  //   value: 'AEAnime',
  //   type: 'english',
  //   flag: FLAGS.ENGLISH,
  // },
  {
    name: 'TokyoInsider',
    value: 'tokyoInsider',
    type: 'english',
    flag: FLAGS.ENGLISH,
  },
  {
    name: 'KissKh',
    value: 'kissKh',
    type: 'english',
    flag: FLAGS.ENGLISH,
  },
  {
    name: 'DramaCool',
    value: 'dramaCool',
    type: 'english',
    flag: FLAGS.ENGLISH,
  },
  // {
  //   name: 'AE Drama',
  //   value: 'AEDrama',
  //   type: 'english',
  //   flag: FLAGS.ENGLISH,
  // },
  {
    name: 'Dooflix',
    value: 'dooflix',
    type: 'india',
    flag: FLAGS.INDIA,
  },
  {
    name: 'RogMovies',
    value: 'lux',
    type: 'india',
    flag: FLAGS.INDIA,
  },
  {
    name: 'TopMovies',
    value: 'topMovies',
    type: 'india',
    flag: FLAGS.INDIA,
  },
  {
    name: 'GuardaHD',
    value: 'guardahd',
    type: 'italy',
    flag: FLAGS.ITALY,
  },
];

export const downloadFolder = RNFS.DownloadDirectoryPath + '/vega';

export const themes: {name: string; color: string}[] = [
  {
    name: 'Vega',
    color: '#FF6347',
  },
  {
    name: 'Hayasaka',
    color: '#00e6e6',
  },
  {
    name: 'Lavender',
    color: '#B2A4D4',
  },
  {
    name: 'Sky',
    color: '#87CEEB',
  },
  {
    name: 'Mint',
    color: '#98FB98',
  },
  {
    name: 'Sunset',
    color: '#FFA07A',
  },
  {
    name: 'Flix',
    color: '#E50914',
  },
  {
    name: 'Material',
    color: '#2196F3',
  },
  {
    name: 'Custom',
    color: '#FFFFFF',
  },
];

export const socialLinks = {
  github: 'https://github.com/Zenda-Cross/vega-app',
  discord: 'https://discord.gg/cr42m6maWy',
};

import RNFS from 'react-native-fs';

export interface ProvidersList {
  name: string;
  value: string;
  type: string;
  flag: string;
}
export const providersList: ProvidersList[] = [
  {
    name: 'VegaMovies',
    value: 'vega',
    type: 'global',
    flag: '🌏',
  },
  {
    name: 'MoviesDrive',
    value: 'drive',
    type: 'global',
    flag: '🌏',
  },
  {
    name: 'MultiMovies',
    value: 'multi',
    type: 'global',
    flag: '🌏',
  },
  {
    name: 'World4uFree',
    value: 'world4u',
    type: 'global',
    flag: '🌏',
  },
  // {
  //   name: 'KatMoviesHd',
  //   value: 'katmovies',
  //   type: 'global',
  //   flag: '🌏',
  // },
  {
    name: 'ExtraMovies',
    value: 'extraMovies',
    type: 'global',
    flag: '🌏',
  },
  {
    name: 'ModMovies',
    value: 'mod',
    type: 'global',
    flag: '🌏',
  },
  {
    name: 'UHDMovies',
    value: 'uhd',
    type: 'global',
    flag: '🌏',
  },
  {
    name: 'NetflixMirror',
    value: 'netflixMirror',
    type: 'global',
    flag: '🌏',
  },
  {
    name: 'AutoEmbed',
    value: 'autoEmbed',
    type: 'global',
    flag: '🌏',
  },
  {
    name: 'HdHub4u',
    value: 'hdhub4u',
    type: 'global',
    flag: '🌏',
  },
  {
    name: 'FlixHQ',
    value: 'flixhq',
    type: 'english',
    flag: '🇬🇧',
  },
  {
    name: 'Primewire',
    value: 'primewire',
    type: 'english',
    flag: '🇬🇧',
  },
  {
    name: 'GogoAnime',
    value: 'gogo',
    type: 'english',
    flag: '🇬🇧',
  },
  {
    name: 'AE Anime',
    value: 'AEAnime',
    type: 'english',
    flag: '🇬🇧',
  },
  {
    name: 'TokyoInsider',
    value: 'tokyoInsider',
    type: 'english',
    flag: '🇬🇧',
  },
  {
    name: 'DramaCool',
    value: 'dramaCool',
    type: 'english',
    flag: '🇬🇧',
  },
  {
    name: 'AE Drama',
    value: 'AEDrama',
    type: 'english',
    flag: '🇬🇧',
  },
  {
    name: 'Dooflix',
    value: 'dooflix',
    type: 'india',
    flag: '🇮🇳',
  },
  {
    name: 'LuxMovies',
    value: 'lux',
    type: 'india',
    flag: '🇮🇳',
  },
];

export const downloadFolder = RNFS.DownloadDirectoryPath + '/vega';

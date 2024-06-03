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
    name: 'LuxMovies',
    value: 'lux',
    type: 'india',
    flag: '🇮🇳',
  },
];

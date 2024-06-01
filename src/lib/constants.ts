export interface ProvidersList {
  name: string;
  value: string;
  type: string;
  flag: string;
}
export const providersList: ProvidersList[] = [
  {
    name: 'Vega',
    value: 'vega',
    type: 'global',
    flag: '🌏',
  },
  {
    name: 'Mod',
    value: 'mod',
    type: 'global',
    flag: '🌏',
  },
  {
    name: 'Lux',
    value: 'lux',
    type: 'india',
    flag: '🇮🇳',
  },
];

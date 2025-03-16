import {MMKVLoader} from 'react-native-mmkv-storage';

export const MMKV = new MMKVLoader().initialize();
export const MmmkvCache = new MMKVLoader().withInstanceID('cache').initialize();

import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {MMKVLoader} from 'react-native-mmkv-storage';
import {ProvidersList, providersList} from '../constants';

const storage = new MMKVLoader().initialize();

export interface Content {
  provider: ProvidersList;
  setProvider: (type: Content['provider']) => void;
}

const useContentStore = create<Content>()(
  persist(
    set => ({
      provider: providersList[1],

      setProvider: (provider: Content['provider']) => set({provider}),
    }),
    {
      name: 'content-storage',
      storage: createJSONStorage(() => storage),
    },
  ),
);

export default useContentStore;

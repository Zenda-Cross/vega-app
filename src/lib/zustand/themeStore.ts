import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {MMKVLoader} from 'react-native-mmkv-storage';
import {MMKV} from '../Mmkv';

const storage = new MMKVLoader().initialize();

export interface Theme {
  primary: string;
  setPrimary: (type: Theme['primary']) => void;
}

const useThemeStore = create<Theme>()(
  persist(
    set => ({
      primary: '#FF6347',

      setPrimary: (primary: Theme['primary']) => {
        set({primary});
        MMKV.setString('primaryColor', primary);
      },
    }),
    {
      name: 'content-storage',
      storage: createJSONStorage(() => storage),
    },
  ),
);

export default useThemeStore;

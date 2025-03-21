import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {MMKVLoader} from 'react-native-mmkv-storage';
import {MMKV} from '../Mmkv';

const storage = new MMKVLoader().initialize();

export interface Theme {
  primary: string;
  isCustom: boolean;
  setPrimary: (type: Theme['primary']) => void;
  setCustom: (isCustom: boolean) => void;
}

const useThemeStore = create<Theme>()(
  persist(
    set => ({
      primary: '#FF6347',
      isCustom: false,

      setPrimary: (primary: Theme['primary']) => {
        set({primary});
        MMKV.setString('primaryColor', primary);
      },
      setCustom: (isCustom: Theme['isCustom']) => {
        set({isCustom});
        MMKV.setBool('isCustom', isCustom);
      },
    }),
    {
      name: 'content-storage',
      storage: createJSONStorage(() => storage),
    },
  ),
);

export default useThemeStore;

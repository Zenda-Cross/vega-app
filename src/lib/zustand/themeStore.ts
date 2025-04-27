import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {MMKVLoader} from 'react-native-mmkv-storage';
import {settingsStorage} from '../storage';

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
      primary: settingsStorage.getPrimaryColor(),
      isCustom: settingsStorage.isCustomTheme(),

      setPrimary: (primary: Theme['primary']) => {
        set({primary});
        settingsStorage.setPrimaryColor(primary);
      },
      setCustom: (isCustom: Theme['isCustom']) => {
        set({isCustom});
        settingsStorage.setCustomTheme(isCustom);
      },
    }),
    {
      name: 'content-storage',
      //@ts-expect-error
      storage: createJSONStorage(() => storage),
    },
  ),
);

export default useThemeStore;

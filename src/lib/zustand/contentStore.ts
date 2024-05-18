import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {MMKVLoader} from 'react-native-mmkv-storage';

const storage = new MMKVLoader().initialize();

export interface Content {
  contentType: 'global' | 'indian';
  setContentType: (type: Content['contentType']) => void;
}

const useContentStore = create<Content>()(
  persist(
    set => ({
      contentType: 'global',

      setContentType: (contentType: Content['contentType']) =>
        set({contentType}),
    }),
    {
      name: 'content-storage',
      storage: createJSONStorage(() => storage),
    },
  ),
);

export default useContentStore;

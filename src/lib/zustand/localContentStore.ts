import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {createZustandStorage} from '../storage/StorageService';
import type {LocalTitle} from '../localContent/model';

interface LocalContentState {
  titles: LocalTitle[];
  saveTitles: (titles: LocalTitle[]) => void;
  removeTitle: (id: string) => void;
  setMetadataTitles: (id: string, enabled: boolean) => void;
  setCollections: (id: string, ids: string[]) => void;
  hideFromLibrary: (id: string) => void;
}

// Displayed in Library, but persisted separately from synced titles and backups.
const useLocalContentStore = create<LocalContentState>()(
  persist(
    set => ({
      titles: [],
      saveTitles: titles =>
        set(state => ({
          titles: [
            ...state.titles.filter(
              item => !titles.some(next => next.id === item.id),
            ),
            ...titles,
          ],
        })),
      removeTitle: id =>
        set(state => ({titles: state.titles.filter(item => item.id !== id)})),
      setCollections: (id, ids) =>
        set(state => ({
          titles: state.titles.map(item =>
            item.id === id
              ? {
                  ...item,
                  collections: [...new Set(ids)],
                  inLibrary: ids.length > 0,
                }
              : item,
          ),
        })),
      hideFromLibrary: id =>
        set(state => ({
          titles: state.titles.map(item =>
            item.id === id ? {...item, inLibrary: false} : item,
          ),
        })),
      setMetadataTitles: (id, enabled) =>
        set(state => ({
          titles: state.titles.map(item =>
            item.id === id ? {...item, useMetadataTitles: enabled} : item,
          ),
        })),
    }),
    {
      name: 'device-local-content-v1',
      storage: createJSONStorage(() => createZustandStorage()),
    },
  ),
);

export default useLocalContentStore;

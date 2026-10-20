import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {createZustandStorage} from '../storage/StorageService';
import type {LocalTitle} from '../localContent/model';
import {createLocalPlayback} from '../localContent/playback';

interface LocalContentState {
  titles: LocalTitle[];
  savePlayback: (id: string, uri: string, position: number, duration: number) => void;
  clearPlayback: (id: string) => void;
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
      savePlayback: (id, uri, position, duration) => set(state => ({
        titles: state.titles.map(title => {
          if (title.id !== id) return title;
          const playback = createLocalPlayback(title, uri, position, duration);
          return playback ? {...title, playback, continueWatchingHidden: false} : title;
        }),
      })),
      clearPlayback: id => set(state => ({titles: state.titles.map(title => title.id === id ? {...title, playback: undefined, continueWatchingHidden: true} : title)})),
      saveTitles: titles =>
        set(state => ({
          titles: [
            ...state.titles.filter(
              item => !titles.some(next => next.id === item.id),
            ),
            ...titles.map(title => ({...title, playback: title.playback ?? state.titles.find(item => item.id === title.id)?.playback, continueWatchingHidden: title.continueWatchingHidden ?? state.titles.find(item => item.id === title.id)?.continueWatchingHidden})),
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

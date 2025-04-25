import {create} from 'zustand';
import {watchListStorage, WatchListItem} from '../storage';

// Reuse the WatchListItem interface from our storage
export type WatchList = WatchListItem;

interface WatchListStore {
  watchList: WatchList[];
  removeItem: (link: string) => void;
  addItem: (item: WatchList) => void;
  // clearWatchList: () => void;
}

const useWatchListStore = create<WatchListStore>()(set => ({
  // Initialize from storage
  watchList: watchListStorage.getWatchList(),

  // Remove item using storage service
  removeItem: link => {
    const newWatchList = watchListStorage.removeFromWatchList(link);
    set({watchList: newWatchList});
  },

  // Add item using storage service
  addItem: item => {
    const newWatchList = watchListStorage.addToWatchList(item);
    set({watchList: newWatchList});
  },

  // Clear watchlist - commented out but updated to use storage service
  // clearWatchList: () => {
  //   const emptyList = watchListStorage.clearWatchList();
  //   set({watchList: emptyList});
  // },
}));

export default useWatchListStore;

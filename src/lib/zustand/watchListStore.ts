import {create} from 'zustand';
import {MMKV} from '../Mmkv';

export interface WatchList {
  title: string;
  poster: string;
  link: string;
  provider: string;
}

interface WatchListStore {
  watchList: WatchList[];
  removeItem: (link: string) => void;
  addItem: (item: WatchList) => void;
  //   clearWatchList: () => void;
}

const useWatchListStore = create<WatchListStore>()(set => ({
  watchList: JSON.parse(MMKV.getString('watchlist') || '[]'),
  removeItem: link => {
    const watchList = JSON.parse(MMKV.getString('watchlist') || '[]');
    const newWatchList = watchList.filter((i: WatchList) => i.link !== link);
    MMKV.setString('watchlist', JSON.stringify(newWatchList));
    set({watchList: newWatchList});
  },
  addItem: item => {
    const watchList = JSON.parse(MMKV.getString('watchlist') || '[]');
    const newWatchList = watchList.filter(
      (i: WatchList) => i.link !== item.link,
    );
    newWatchList.push(item);
    MMKV.setString('watchlist', JSON.stringify(newWatchList));
    set({watchList: newWatchList});
  },
  //   clearWatchList: () => {
  //     MMKV.setString('watchlist', '[]');
  //     set({watchList: []});
  //   },
}));

export default useWatchListStore;

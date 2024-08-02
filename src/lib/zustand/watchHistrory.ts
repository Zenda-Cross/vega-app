import {create} from 'zustand';
import {Post} from '../providers/types';
import {MMKV} from '../Mmkv';
export interface History {
  history: Post[];
  removeItem: (item: Post) => void;
  addItem: (item: Post) => void;
  clearHistory: () => void;
}
const showWatchHistory = MMKV.getBool('showRecentlyWatched');

const useWatchHistoryStore = create<History>(set => ({
  history: JSON.parse(MMKV.getString('recentlyWatched') || '[]'),
  removeItem: item => {
    const history = JSON.parse(MMKV.getString('recentlyWatched') || '[]');
    const newHistory = history.filter((i: Post) => i.link !== item.link);
    MMKV.setString('recentlyWatched', JSON.stringify(newHistory));
    set({history: newHistory});
  },
  addItem: item => {
    if (showWatchHistory) {
      const history = JSON.parse(MMKV.getString('recentlyWatched') || '[]');
      const newHistory = history.filter((i: Post) => i.link !== item.link);
      newHistory.unshift(item);
      MMKV.setString('recentlyWatched', JSON.stringify(newHistory));
      set({history: newHistory});
    }
  },
  clearHistory: () => {
    MMKV.setString('recentlyWatched', '[]');
    set({history: []});
  },
}));

export default useWatchHistoryStore;

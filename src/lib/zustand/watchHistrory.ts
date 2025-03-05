import {create} from 'zustand';
import {Post} from '../providers/types';
import {MMKV} from '../Mmkv';

interface WatchHistoryItem extends Post {
  lastPlayed: number;
  duration: number;
  currentTime: number;
  playbackRate: number;
  episodeTitle?: string;
  cachedInfoData?: any; // Add cached info data
}

export interface History {
  history: WatchHistoryItem[];
  addItem: (item: WatchHistoryItem) => void;
  updatePlaybackInfo: (link: string, playbackInfo: Partial<WatchHistoryItem>) => void;
  clearHistory: () => void;
  updateItemWithInfo: (link: string, infoData: any) => void;
}

const useWatchHistoryStore = create<History>((set) => ({
  history: JSON.parse(MMKV.getString('recentlyWatched') || '[]'),

  addItem: (item) => {
    try {
      const history = JSON.parse(MMKV.getString('recentlyWatched') || '[]');
      const newHistory = history.filter((i: WatchHistoryItem) => 
        !(i.link === item.link || i.title === item.title)
      );

      newHistory.unshift({
        ...item,
        lastPlayed: Date.now()
      });

      const limitedHistory = newHistory.slice(0, 100);
      MMKV.setString('recentlyWatched', JSON.stringify(limitedHistory));
      set({history: limitedHistory});
    } catch (error) {
      console.error('❌ Error:', error);
    }
  },

  updatePlaybackInfo: (link, playbackInfo) => {
    try {
      const history = JSON.parse(MMKV.getString('recentlyWatched') || '[]');
      const newHistory = history.map((item: WatchHistoryItem) => {
        if (item.link === link) {
          return {...item, ...playbackInfo, lastPlayed: Date.now()};
        }
        return item;
      });
      
      MMKV.setString('recentlyWatched', JSON.stringify(newHistory));
      set({history: newHistory});
    } catch (error) {
      console.error('❌ Error updating watch history:', error);
    }
  },

  clearHistory: () => {
    MMKV.setString('recentlyWatched', '[]');
    set({history: []});
  },

  updateItemWithInfo: (link, infoData) => {
    try {
      const history = JSON.parse(MMKV.getString('recentlyWatched') || '[]');
      const newHistory = history.map((item: WatchHistoryItem) => {
        if (item.link === link) {
          return { ...item, cachedInfoData: infoData };
        }
        return item;
      });
      
      MMKV.setString('recentlyWatched', JSON.stringify(newHistory));
      set({ history: newHistory });
    } catch (error) {
      console.error('❌ Error caching info data:', error);
    }
  },
}));

export default useWatchHistoryStore;

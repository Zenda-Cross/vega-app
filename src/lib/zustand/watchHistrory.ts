import {create} from 'zustand';
import {WatchHistoryItem, watchHistoryStorage} from '../storage';

export interface History {
  history: WatchHistoryItem[];
  addItem: (item: WatchHistoryItem) => void;
  updatePlaybackInfo: (
    link: string,
    playbackInfo: Partial<WatchHistoryItem>,
  ) => void;
  clearHistory: () => void;
  updateItemWithInfo: (link: string, infoData: any) => void;
  removeItem: (item: WatchHistoryItem) => void;
}

// Helper function to convert between our storage format and zustand format
const convertStorageToZustand = (items: any[]): WatchHistoryItem[] => {
  return items.map(item => ({
    ...item,
    lastPlayed: item.timestamp,
    currentTime: item.progress || 0,
  }));
};

const useWatchHistoryStore = create<History>(set => ({
  // Initialize from our storage service
  history: convertStorageToZustand(watchHistoryStorage.getWatchHistory()),

  addItem: item => {
    try {
      // Format item for our storage service
      const storageItem: WatchHistoryItem = {
        id: item.link || item.title,
        title: item.title,
        poster: item.poster,
        provider: item.provider,
        link: item.link,
        timestamp: Date.now(),
        duration: item.duration,
        progress: item.currentTime,
        episodeTitle: item.episodeTitle,
        cachedInfoData: item.cachedInfoData,
      };

      // Add to storage
      watchHistoryStorage.addToWatchHistory(storageItem);

      // Update UI state
      set({
        history: convertStorageToZustand(watchHistoryStorage.getWatchHistory()),
      });
    } catch (error) {
      console.error('❌ Error:', error);
    }
  },

  updatePlaybackInfo: (link, playbackInfo) => {
    try {
      const history = watchHistoryStorage.getWatchHistory();
      const existingItem = history.find(item => item.link === link);

      if (existingItem) {
        const updatedItem = {
          ...existingItem,
          progress: playbackInfo.currentTime,
          duration: playbackInfo.duration || existingItem.duration,
          timestamp: Date.now(),
        };

        watchHistoryStorage.addToWatchHistory(updatedItem);
      }

      set({
        history: convertStorageToZustand(watchHistoryStorage.getWatchHistory()),
      });
    } catch (error) {
      console.error('❌ Error updating watch history:', error);
    }
  },

  removeItem: item => {
    watchHistoryStorage.removeFromWatchHistory(item.link);
    set({
      history: convertStorageToZustand(watchHistoryStorage.getWatchHistory()),
    });
  },

  clearHistory: () => {
    watchHistoryStorage.clearWatchHistory();
    set({history: []});
  },

  updateItemWithInfo: (link, infoData) => {
    try {
      const history = watchHistoryStorage.getWatchHistory();
      const existingItem = history.find(item => item.link === link);

      if (existingItem) {
        const updatedItem = {
          ...existingItem,
          cachedInfoData: infoData,
        };

        watchHistoryStorage.addToWatchHistory(updatedItem);
      }

      set({
        history: convertStorageToZustand(watchHistoryStorage.getWatchHistory()),
      });
    } catch (error) {
      console.error('❌ Error caching info data:', error);
    }
  },
}));

export default useWatchHistoryStore;

import {mainStorage} from './StorageService';

/**
 * Storage keys for watch history
 */
export enum WatchHistoryKeys {
  WATCH_HISTORY = 'watchHistory',
  SERIES_EPISODES = 'seriesEpisodes',
}

/**
 * Interface for watch history item
 */
export interface WatchHistoryItem {
  id: string;
  title: string;
  poster?: string;
  provider?: string;
  link: string;
  timestamp?: number;
  duration?: number;
  progress?: number;
  isSeries?: boolean;
  lastPlayed?: number;
  currentTime?: number;
  playbackRate?: number;
  episodeTitle?: string;
  cachedInfoData?: any; // Add cached info data
}

/**
 * Interface for series episode
 */
export interface SeriesEpisode {
  uri: string;
  size: number;
  thumbnail?: string;
}

/**
 * Watch history storage manager
 */
export class WatchHistoryStorage {
  /**
   * Get all watch history items
   */
  getWatchHistory(): WatchHistoryItem[] {
    return (
      mainStorage.getArray<WatchHistoryItem>(WatchHistoryKeys.WATCH_HISTORY) ||
      []
    );
  }

  /**
   * Add or update an item in watch history
   */
  addToWatchHistory(item: WatchHistoryItem): void {
    const history = this.getWatchHistory();

    // Check if the item already exists
    const existingIndex = history.findIndex(i => i.id === item.id);

    if (existingIndex !== -1) {
      // Update existing item
      history[existingIndex] = {
        ...history[existingIndex],
        ...item,
        timestamp: Date.now(), // Always update timestamp
      };
    } else {
      // Add new item
      history.unshift({
        ...item,
        timestamp: Date.now(),
      });
    }

    // Limit history to 100 items
    const limitedHistory = history.slice(0, 100);

    mainStorage.setArray(WatchHistoryKeys.WATCH_HISTORY, limitedHistory);
  }

  /**
   * Remove an item from watch history
   */
  removeFromWatchHistory(id: string): void {
    const history = this.getWatchHistory();
    const filteredHistory = history.filter(item => item.id !== id);
    mainStorage.setArray(WatchHistoryKeys.WATCH_HISTORY, filteredHistory);
  }

  /**
   * Clear all watch history
   */
  clearWatchHistory(): void {
    mainStorage.setArray(WatchHistoryKeys.WATCH_HISTORY, []);
  }

  /**
   * Update progress for a specific item
   */
  updateProgress(id: string, progress: number, duration?: number): void {
    const history = this.getWatchHistory();
    const existingIndex = history.findIndex(i => i.id === id);

    if (existingIndex !== -1) {
      history[existingIndex] = {
        ...history[existingIndex],
        progress,
        duration,
        timestamp: Date.now(),
      };

      mainStorage.setArray(WatchHistoryKeys.WATCH_HISTORY, history);
    }
  }

  /**
   * Get series episodes
   */
  getSeriesEpisodes(seriesId: string): Record<string, SeriesEpisode> {
    const allSeries =
      mainStorage.getObject<Record<string, Record<string, SeriesEpisode>>>(
        WatchHistoryKeys.SERIES_EPISODES,
      ) || {};

    return allSeries[seriesId] || {};
  }

  /**
   * Add or update series episodes
   */
  addSeriesEpisodes(
    seriesId: string,
    episodes: Record<string, SeriesEpisode>,
  ): void {
    const allSeries =
      mainStorage.getObject<Record<string, Record<string, SeriesEpisode>>>(
        WatchHistoryKeys.SERIES_EPISODES,
      ) || {};

    allSeries[seriesId] = {
      ...allSeries[seriesId],
      ...episodes,
    };

    mainStorage.setObject(WatchHistoryKeys.SERIES_EPISODES, allSeries);
  }

  /**
   * Remove series episodes
   */
  removeSeriesEpisodes(seriesId: string): void {
    const allSeries =
      mainStorage.getObject<Record<string, Record<string, SeriesEpisode>>>(
        WatchHistoryKeys.SERIES_EPISODES,
      ) || {};

    delete allSeries[seriesId];

    mainStorage.setObject(WatchHistoryKeys.SERIES_EPISODES, allSeries);
  }
}

// Export a singleton instance
export const watchHistoryStorage = new WatchHistoryStorage();

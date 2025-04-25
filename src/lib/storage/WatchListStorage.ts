import {mainStorage} from './StorageService';

/**
 * Storage key for watchlist
 */
export enum WatchListKeys {
  WATCH_LIST = 'watchlist',
}

/**
 * Interface for watchlist item
 */
export interface WatchListItem {
  title: string;
  poster: string;
  link: string;
  provider: string;
}

/**
 * Watchlist storage manager
 */
export class WatchListStorage {
  /**
   * Get all watchlist items
   */
  getWatchList(): WatchListItem[] {
    return mainStorage.getArray<WatchListItem>(WatchListKeys.WATCH_LIST) || [];
  }

  /**
   * Add an item to the watchlist
   */
  addToWatchList(item: WatchListItem): WatchListItem[] {
    const watchList = this.getWatchList();

    // Filter out any existing item with the same link
    const newWatchList = watchList.filter(i => i.link !== item.link);

    // Add the new item to the end
    newWatchList.push(item);

    // Save the updated watchlist
    mainStorage.setArray(WatchListKeys.WATCH_LIST, newWatchList);

    return newWatchList;
  }

  /**
   * Remove an item from the watchlist
   */
  removeFromWatchList(link: string): WatchListItem[] {
    const watchList = this.getWatchList();
    const newWatchList = watchList.filter(item => item.link !== link);

    mainStorage.setArray(WatchListKeys.WATCH_LIST, newWatchList);

    return newWatchList;
  }

  /**
   * Clear all items from the watchlist
   */
  clearWatchList(): WatchListItem[] {
    const emptyList: WatchListItem[] = [];
    mainStorage.setArray(WatchListKeys.WATCH_LIST, emptyList);
    return emptyList;
  }

  /**
   * Check if an item exists in the watchlist
   */
  isInWatchList(link: string): boolean {
    const watchList = this.getWatchList();
    return watchList.some(item => item.link === link);
  }
}

// Export a singleton instance
export const watchListStorage = new WatchListStorage();

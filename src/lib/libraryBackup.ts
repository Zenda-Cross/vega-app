import {mainStorage} from './storage/StorageService';
import {watchListStorage} from './storage/WatchListStorage';
import {WatchListKeys, type WatchListItem, type LibraryCollection} from './storage/WatchListStorage';
import useWatchListStore from './zustand/watchListStore';

export interface LibraryBackup {
  items: WatchListItem[];
  collections: LibraryCollection[];
}

export const createLibraryBackup = (): LibraryBackup => ({
  items: watchListStorage.getWatchList(),
  collections: watchListStorage.getCollections(),
});

export const validateLibraryBackup = (value: unknown): void => {
  if (value === undefined) return;
  const library = value as LibraryBackup;
  const strings = (input: unknown) => Array.isArray(input) && input.every(id => typeof id === 'string');
  const timestamp = (input: unknown) => typeof input === 'number' && Number.isFinite(input);
  if (!library || !Array.isArray(library.items) || !Array.isArray(library.collections) ||
    !library.items.every(item => item && typeof item.title === 'string' && typeof item.link === 'string' &&
      typeof item.provider === 'string' && typeof item.poster === 'string' &&
      (item.collections === undefined || strings(item.collections)) &&
      (item.updatedAt === undefined || timestamp(item.updatedAt))) ||
    !library.collections.every(collection => collection && typeof collection.id === 'string' &&
      typeof collection.name === 'string' && typeof collection.icon === 'string' &&
      (collection.color === undefined || typeof collection.color === 'string') &&
      timestamp(collection.createdAt) && timestamp(collection.updatedAt))) {
    throw new Error('This backup contains an invalid library');
  }
};

export const restoreLibraryBackup = (library?: LibraryBackup): void => {
  if (library === undefined) return;
  validateLibraryBackup(library);
  mainStorage.setArray(WatchListKeys.WATCH_LIST, library.items);
  mainStorage.setArray(WatchListKeys.COLLECTIONS, library.collections);
  // Preserve an intentionally deleted default category, including an empty library.
  mainStorage.setBool(WatchListKeys.DEFAULT_COLLECTION_ADDED, true);
  useWatchListStore.setState({watchList: library.items, collections: library.collections});
};

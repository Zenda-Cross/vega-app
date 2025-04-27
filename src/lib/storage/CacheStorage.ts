import {cacheStorage} from './StorageService';

/**
 * Cache storage manager for storing temporary data
 */
export class CacheStorage {
  /**
   * Set a string value in cache
   */
  setString(key: string, value: string): void {
    cacheStorage.setString(key, value);
  }

  /**
   * Get a string value from cache
   */
  getString(key: string): string | undefined {
    return cacheStorage.getString(key);
  }

  /**
   * Set a boolean value in cache
   */
  setBool(key: string, value: boolean): void {
    cacheStorage.setBool(key, value);
  }

  /**
   * Get a boolean value from cache
   */
  getBool(key: string): boolean | undefined {
    return cacheStorage.getBool(key, undefined);
  }

  /**
   * Set an object value in cache
   */
  setObject<T>(key: string, value: T): void {
    cacheStorage.setObject(key, value);
  }

  /**
   * Get an object value from cache
   */
  getObject<T>(key: string): T | undefined {
    return cacheStorage.getObject<T>(key);
  }

  /**
   * Delete a value from cache
   */
  delete(key: string): void {
    cacheStorage.delete(key);
  }

  /**
   * Check if a key exists in cache
   */
  contains(key: string): boolean {
    return cacheStorage.contains(key);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    cacheStorage.clearAll();
  }
}

// Export singleton instance
export const cacheStorageService = new CacheStorage();

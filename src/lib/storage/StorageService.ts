import {MMKVLoader} from 'react-native-mmkv-storage';

/**
 * Interface for the StorageService class
 */
export interface IStorageService {
  getString(key: string): string | undefined;
  setString(key: string, value: string): void;
  getBool(key: string, defaultValue?: boolean): boolean;
  setBool(key: string, value: boolean): void;
  getNumber(key: string): number | undefined;
  setNumber(key: string, value: number): void;
  getObject<T>(key: string): T | undefined;
  setObject<T>(key: string, value: T): void;
  getArray<T>(key: string): T[] | undefined;
  setArray<T>(key: string, value: T[]): void;
  delete(key: string): void;
  contains(key: string): boolean;
  clearAll(): void;
}

/**
 * Base storage service that wraps MMKV operations
 */
export class StorageService implements IStorageService {
  // Define storage variable with proper typing
  private storage: any;

  constructor(instanceId?: string) {
    const loader = new MMKVLoader();
    this.storage = instanceId
      ? loader.withInstanceID(instanceId).initialize()
      : loader.initialize();
  }

  // String operations
  getString(key: string): string | undefined {
    return this.storage.getString(key);
  }

  setString(key: string, value: string): void {
    this.storage.setString(key, value);
  }

  // Boolean operations
  getBool(key: string, defaultValue?: boolean): boolean {
    const value = this.storage.getBool(key);
    return value === undefined ? defaultValue || false : value;
  }

  setBool(key: string, value: boolean): void {
    this.storage.setBool(key, value);
  }

  // Number operations
  getNumber(key: string): number | undefined {
    // Use getInt or getFloat depending on what's available
    if (typeof this.storage.getFloat === 'function') {
      return this.storage.getFloat(key);
    } else if (typeof this.storage.getInt === 'function') {
      return this.storage.getInt(key);
    } else {
      // Fallback to parsing from string if numeric methods aren't available
      const value = this.storage.getString(key);
      return value !== undefined ? parseFloat(value) : undefined;
    }
  }

  setNumber(key: string, value: number): void {
    // Use setInt or setFloat depending on what's available
    if (typeof this.storage.setFloat === 'function') {
      this.storage.setFloat(key, value);
    } else if (typeof this.storage.setInt === 'function') {
      this.storage.setInt(key, Math.floor(value));
    } else {
      // Fallback to storing as string if numeric methods aren't available
      this.storage.setString(key, value.toString());
    }
  }

  // Object operations
  getObject<T>(key: string): T | undefined {
    const json = this.storage.getString(key);
    if (!json) return undefined;
    try {
      return JSON.parse(json) as T;
    } catch (e) {
      console.error(`Failed to parse stored object for key ${key}:`, e);
      return undefined;
    }
  }

  setObject<T>(key: string, value: T): void {
    this.storage.setString(key, JSON.stringify(value));
  }

  // Array operations
  getArray<T>(key: string): T[] | undefined {
    return this.getObject<T[]>(key);
  }

  setArray<T>(key: string, value: T[]): void {
    this.setObject(key, value);
  }

  // Delete operations
  delete(key: string): void {
    this.storage.removeItem(key);
  }

  // Check if key exists
  contains(key: string): boolean {
    return this.storage.contains(key);
  }

  // Clear all storage
  clearAll(): void {
    this.storage.clearAll();
  }
}

// Create and export default instances
export const mainStorage: IStorageService = new StorageService();
export const cacheStorage: IStorageService = new StorageService('cache');

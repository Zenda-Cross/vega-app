import {cacheStorage} from './StorageService';
import * as FileSystem from 'expo-file-system';

/**
 * Storage keys for downloads
 */
export enum DownloadsKeys {
  FILES = 'downloadFiles',
  THUMBNAILS = 'downloadThumbnails',
}

/**
 * Downloads storage manager
 */
export class DownloadsStorage {
  /**
   * Save download files information
   */
  saveFilesInfo(files: FileSystem.FileInfo[]): void {
    cacheStorage.setObject(DownloadsKeys.FILES, files);
  }

  /**
   * Get download files information
   */
  getFilesInfo(): FileSystem.FileInfo[] | null {
    return (
      cacheStorage.getObject<FileSystem.FileInfo[]>(DownloadsKeys.FILES) || null
    );
  }

  /**
   * Save download thumbnails
   */
  saveThumbnails(thumbnails: Record<string, string>): void {
    cacheStorage.setObject(DownloadsKeys.THUMBNAILS, thumbnails);
  }

  /**
   * Get download thumbnails
   */
  getThumbnails(): Record<string, string> | null {
    return (
      cacheStorage.getObject<Record<string, string>>(
        DownloadsKeys.THUMBNAILS,
      ) || null
    );
  }

  /**
   * Clear downloads cache
   */
  clearCache(): void {
    cacheStorage.delete(DownloadsKeys.FILES);
    cacheStorage.delete(DownloadsKeys.THUMBNAILS);
  }
}

// Export a singleton instance
export const downloadsStorage = new DownloadsStorage();

import {downloadFolder} from '../constants';
import {downloadsStorage} from '../storage';
import {DownloadPayload} from '../storage/DownloadsStorage';
import * as RNFS from '@dr.pogodin/react-native-fs';

export class DownloadManager {
  private static instance: DownloadManager;

  private downloads: Map<string, DownloadPayload> =
    downloadsStorage.getDownloads();

  public static getInstance(): DownloadManager {
    if (!DownloadManager.instance) {
      DownloadManager.instance = new DownloadManager();
    }
    return DownloadManager.instance;
  }

  updateDownloadStatus(
    id: string,
    status: 'downloading' | 'paused' | 'downloaded',
  ): void {
    const download = this.downloads.get(id);
    if (download) {
      download.status = status;
      this.downloads.set(id, download);
      downloadsStorage.saveDownloads(this.downloads);
    }
  }

  updateDownload(id: string, payload: Partial<DownloadPayload>): void {
    const download = this.downloads.get(id);
    if (download) {
      Object.assign(download, payload);
      this.downloads.set(id, download);
      downloadsStorage.saveDownloads(this.downloads);
    }
  }

  addDownload(id: string, payload: DownloadPayload): void {
    this.downloads.set(id, payload);
    downloadsStorage.saveDownloads(this.downloads);
  }

  async removeDownloadAsync(id: string): Promise<void> {
    const download = this.downloads.get(id);
    if (!download) {
      return;
    }
    try {
      await RNFS.unlink(this.generateDownloadLocation(download));
    } catch (error) {
      console.error('Failed to remove download:', error);
      console.log('path:', this.generateDownloadLocation(download));
    }
    const downloadExists = await RNFS.exists(
      this.generateDownloadLocation(download),
    );
    console.log('Download exists after removal attempt:', downloadExists);

    if (!downloadExists) {
      this.downloads.delete(id);
      downloadsStorage.saveDownloads(this.downloads);
    }
  }

  removeDownload(id: string): void {
    this.downloads.delete(id);
    downloadsStorage.saveDownloads(this.downloads);
  }

  getDownload(id: string): DownloadPayload | undefined {
    return this.downloads.get(id);
  }

  isDownloaded(id: string): boolean {
    return (
      this.downloads.has(id) && this.downloads.get(id)?.status === 'downloaded'
    );
  }

  getAllDownloads(): Map<string, DownloadPayload> {
    return this.downloads;
  }

  generateDownloadId({
    folderName,
    fileName,
  }: {
    folderName: string;
    fileName: string;
  }): string {
    return `${folderName}${fileName}`;
  }

  generateDownloadLocation(downloadPayload: DownloadPayload): string {
    return `${downloadFolder}/${downloadPayload.provider}/${downloadPayload.folderName}/${downloadPayload.fileName}.${downloadPayload.fileType}`;
  }
}

export const downloadManager = DownloadManager.getInstance();

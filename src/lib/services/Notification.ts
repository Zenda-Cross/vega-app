import notifee, {AndroidImportance} from '@notifee/react-native';
import {settingsStorage} from '../storage';

export interface NotificationOptions {
  id: string;
  title: string;
  body: string;
  data?: any;
  progress?: {
    max: number;
    current: number;
    indeterminate?: boolean;
  };
  actions?: Array<{
    title: string;
    pressAction: {
      id: string;
    };
  }>;
  onlyAlertOnce?: boolean;
}

export interface ChannelOptions {
  id: string;
  name: string;
  importance?: AndroidImportance;
  description?: string;
}

class NotificationService {
  private _defaultChannelId = 'default';
  private _downloadChannelId = 'download';
  private _updateChannelId = 'update';
  private initialized = false;

  constructor() {
    this.initialize();
  }
  private async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Create default channels
      await this.createDefaultChannels();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  private async createDefaultChannels() {
    // Default channel
    await notifee.createChannel({
      id: this._defaultChannelId,
      name: 'Default Notifications',
      importance: AndroidImportance.DEFAULT,
    });

    // Download channel
    await notifee.createChannel({
      id: this._downloadChannelId,
      name: 'Download Notifications',
      importance: AndroidImportance.HIGH,
      description: 'Notifications for download progress and completion',
    });

    // Update channel
    await notifee.createChannel({
      id: this._updateChannelId,
      name: 'Update Notifications',
      importance: AndroidImportance.DEFAULT,
      description: 'Notifications for app and provider updates',
    });
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<any> {
    await this.ensureInitialized();
    return await notifee.requestPermission();
  }

  /**
   * Create a custom channel
   */
  async createChannel(options: ChannelOptions): Promise<string> {
    await this.ensureInitialized();
    return await notifee.createChannel({
      id: options.id,
      name: options.name,
      importance: options.importance || AndroidImportance.DEFAULT,
      description: options.description,
    });
  }

  /**
   * Display a notification with common settings
   */
  async displayNotification(
    options: NotificationOptions,
    channelId?: string,
  ): Promise<void> {
    await this.ensureInitialized();
    const primary = settingsStorage.getPrimaryColor();

    await notifee.displayNotification({
      id: options.id,
      title: options.title,
      body: options.body,
      data: options.data,
      android: {
        smallIcon: 'ic_notification',
        channelId: channelId || this._defaultChannelId,
        color: primary,
        pressAction: {
          id: 'default',
        },
        progress: options.progress,
        actions: options.actions,
        onlyAlertOnce: options.onlyAlertOnce || false,
      },
    });
  }

  /**
   * Display a download notification
   */
  async displayDownloadNotification(
    options: NotificationOptions,
  ): Promise<void> {
    await this.displayNotification(options, this._downloadChannelId);
  }

  /**
   * Display an update notification
   */
  async displayUpdateNotification(options: NotificationOptions): Promise<void> {
    await this.displayNotification(options, this._updateChannelId);
  }

  /**
   * Cancel a notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await this.ensureInitialized();
    await notifee.cancelNotification(notificationId);
  }

  /**
   * Cancel all notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await this.ensureInitialized();
    await notifee.cancelAllNotifications();
  }

  /**
   * Set up event handlers for notification actions
   */
  setupEventHandlers(
    foregroundHandler: (event: any) => void,
    backgroundHandler: (event: any) => Promise<void>,
  ) {
    notifee.onForegroundEvent(foregroundHandler);
    notifee.onBackgroundEvent(backgroundHandler);
  }

  /**
   * Helper method to show download starting notification
   */
  async showDownloadStarting(title: string, fileName: string): Promise<void> {
    await this.displayDownloadNotification({
      id: fileName,
      title: title,
      body: 'Starting download',
      progress: {
        max: 100,
        current: 0,
        indeterminate: true,
      },
    });
  }

  /**
   * Helper method to show download progress notification
   */
  async showDownloadProgress(
    title: string,
    fileName: string,
    progress: number,
    progressText: string,
    jobId?: number,
  ): Promise<void> {
    await this.displayDownloadNotification({
      id: fileName,
      title: title,
      body: progressText,
      data: {jobId, fileName},
      progress: {
        max: 100,
        current: Math.min(Math.max(progress * 100, 0), 100),
        indeterminate: false,
      },
      actions: [
        {
          title: 'Cancel',
          pressAction: {
            id: fileName,
          },
        },
      ],
      onlyAlertOnce: true,
    });
  }

  /**
   * Helper method to show download complete notification
   */
  async showDownloadComplete(title: string, fileName: string): Promise<void> {
    await this.cancelNotification(fileName);
    await this.displayDownloadNotification({
      id: `downloadComplete${fileName}`,
      title: 'Download complete',
      body: title,
    });
  }

  /**
   * Helper method to show download failed notification
   */
  async showDownloadFailed(title: string, fileName: string): Promise<void> {
    await this.cancelNotification(fileName);
    await this.displayDownloadNotification({
      id: `downloadFailed${fileName}`,
      title: 'Download failed',
      body: title,
    });
  }

  /**
   * Helper method to show update available notification
   */
  async showUpdateAvailable(
    title: string,
    body: string,
    actions?: Array<{title: string; pressAction: {id: string}}>,
  ): Promise<void> {
    await this.displayUpdateNotification({
      id: 'updateAvailable',
      title: title,
      body: body,
      actions: actions,
    });
  }

  /**
   * Helper method to show update progress notification
   */
  async showUpdateProgress(
    title: string,
    body: string,
    progress?: {max: number; current: number; indeterminate?: boolean},
  ): Promise<void> {
    await this.displayUpdateNotification({
      id: 'updateProgress',
      title: title,
      body: body,
      progress: progress,
    });
  }

  /**
   * Get the default download channel ID
   */
  getDownloadChannelId(): string {
    return this._downloadChannelId;
  }

  /**
   * Get the default update channel ID
   */
  getUpdateChannelId(): string {
    return this._updateChannelId;
  }

  /**
   * Get the default channel ID
   */
  getDefaultChannelId(): string {
    return this._defaultChannelId;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }
}

// Export a singleton instance
export const notificationService = new NotificationService();
export default notificationService;

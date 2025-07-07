import {AndroidImportance} from '@notifee/react-native';
import {extensionStorage, ProviderExtension} from '../storage/extensionStorage';
import {extensionManager} from './ExtensionManager';
import {settingsStorage} from '../storage';
import {notificationService} from './Notification';

export interface UpdateInfo {
  provider: ProviderExtension;
  currentVersion: string;
  newVersion: string;
  hasUpdate: boolean;
}

class UpdateProvidersService {
  private isUpdating = false;
  private updateCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Check for updates for all installed providers
   */
  async checkForUpdates(): Promise<UpdateInfo[]> {
    try {
      const installedProviders = extensionStorage.getInstalledProviders();
      const availableProviders = await extensionManager.fetchManifest(true);

      const updateInfos: UpdateInfo[] = [];

      for (const installed of installedProviders) {
        const available = availableProviders.find(
          p => p.value === installed.value,
        );

        if (
          available &&
          this.isNewerVersion(available.version, installed.version)
        ) {
          updateInfos.push({
            provider: available,
            currentVersion: installed.version,
            newVersion: available.version,
            hasUpdate: true,
          });
        } else {
          updateInfos.push({
            provider: installed,
            currentVersion: installed.version,
            newVersion: installed.version,
            hasUpdate: false,
          });
        }
      }

      return updateInfos;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return [];
    }
  }

  /**
   * Update a specific provider
   */
  async updateProvider(provider: ProviderExtension): Promise<boolean> {
    try {
      // Uninstall old version
      extensionStorage.uninstallProvider(provider.value);

      // Install new version
      await extensionManager.installProvider(provider);

      return true;
    } catch (error) {
      console.error('Error updating provider:', error);
      return false;
    }
  }

  /**
   * Update multiple providers with progress notifications
   */
  async updateProviders(providers: ProviderExtension[]): Promise<{
    updated: ProviderExtension[];
    failed: ProviderExtension[];
  }> {
    if (this.isUpdating || providers.length === 0) {
      return {updated: [], failed: []};
    }

    this.isUpdating = true;
    const updated: ProviderExtension[] = [];
    const failed: ProviderExtension[] = [];

    try {
      // Show updating notification
      await this.showUpdatingNotification(providers);

      for (const provider of providers) {
        const success = await this.updateProvider(provider);
        if (success) {
          updated.push(provider);
        } else {
          failed.push(provider);
        }
      }

      // Show completion notification
      await this.showUpdateCompleteNotification(updated, failed);

      return {updated, failed};
    } finally {
      this.isUpdating = false;
    }
  }
  /**
   * Check for updates and automatically start updating if updates are available
   */
  async checkForUpdatesAndAutoUpdate(): Promise<UpdateInfo[]> {
    const updateInfos = await this.checkForUpdates();
    const availableUpdates = updateInfos.filter(info => info.hasUpdate);
    if (
      availableUpdates.length > 0 &&
      settingsStorage.isNotificationsEnabled()
    ) {
      // Automatically start updating instead of just showing notification
      const providersToUpdate = availableUpdates.map(update => update.provider);
      // Don't await here to avoid blocking - let it run in background
      this.updateProviders(providersToUpdate);
    }
    return updateInfos;
  }

  /**
   * Check for updates without auto-updating (for manual refresh)
   */
  async checkForUpdatesManual(): Promise<UpdateInfo[]> {
    return await this.checkForUpdates();
  }

  /**
   * Start automatic update checking
   */
  startAutomaticUpdateCheck(): void {
    // Check immediately
    this.checkForUpdatesAndAutoUpdate();

    // Check every 6 hours
    this.updateCheckInterval = setInterval(
      () => {
        this.checkForUpdatesAndAutoUpdate();
      },
      6 * 60 * 60 * 1000,
    );
  }

  /**
   * Stop automatic update checking
   */
  stopAutomaticUpdateCheck(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }
  }
  /**
   * Compare version strings to determine if newVersion is newer than currentVersion
   */
  private isNewerVersion(newVersion: string, currentVersion: string): boolean {
    const parseVersion = (version: string) => {
      return version.split('.').map(part => parseInt(part, 10) || 0);
    };

    const newParts = parseVersion(newVersion);
    const currentParts = parseVersion(currentVersion);

    for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
      const newPart = newParts[i] || 0;
      const currentPart = currentParts[i] || 0;

      if (newPart > currentPart) {
        return true;
      }
      if (newPart < currentPart) {
        return false;
      }
    }

    return false;
  }

  /**
   * Show notification when providers are being updated
   */
  private async showUpdatingNotification(
    providers: ProviderExtension[],
  ): Promise<void> {
    await notificationService.showUpdateProgress(
      'Updating Providers',
      `Updating ${providers.length} provider${
        providers.length > 1 ? 's' : ''
      }...`,
      {
        max: 100,
        current: 0,
        indeterminate: true,
      },
    );
  }

  /**   * Show notification when updates are complete
   */
  private async showUpdateCompleteNotification(
    updated: ProviderExtension[],
    failed: ProviderExtension[],
  ): Promise<void> {
    // Cancel the updating notification
    await notificationService.cancelNotification('updateProgress');

    if (updated.length === 0 && failed.length === 0) {
      return;
    }

    let title = '';
    let body = '';

    if (updated.length > 0 && failed.length === 0) {
      title = 'Providers Updated Successfully';
      body = `${updated.length} provider${
        updated.length > 1 ? 's' : ''
      } updated: ${updated.map(p => p.display_name).join(', ')}`;
    } else if (updated.length > 0 && failed.length > 0) {
      title = 'Providers Update Complete';
      body = `${updated.length} updated, ${failed.length} failed`;
    } else {
      title = 'Provider Update Failed';
      body = `Failed to update ${failed.length} provider${
        failed.length > 1 ? 's' : ''
      }`;
    }

    await notificationService.displayUpdateNotification({
      id: 'providers-updated',
      title,
      body,
    });
  }

  /**
   * Get current updating state
   */
  get updating(): boolean {
    return this.isUpdating;
  }
}

export const updateProvidersService = new UpdateProvidersService();

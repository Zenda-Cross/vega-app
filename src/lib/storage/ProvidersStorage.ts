import {mainStorage} from './StorageService';
import {providersList} from '../constants';

/**
 * Storage keys for providers
 */
export enum ProvidersKeys {
  DISABLED_PROVIDERS = 'disabledProviders',
}

/**
 * Providers storage manager
 */
export class ProvidersStorage {
  /**
   * Get disabled providers list
   */
  getDisabledProviders(): string[] {
    const saved = mainStorage.getObject<string[]>(
      ProvidersKeys.DISABLED_PROVIDERS,
    );
    if (!saved || saved.length === 0) {
      const allProviders = providersList.map(p => p.value);
      this.setDisabledProviders(allProviders);
      return allProviders;
    }
    return saved;
  }

  /**
   * Set disabled providers list
   */
  setDisabledProviders(providers: string[]): void {
    mainStorage.setObject(ProvidersKeys.DISABLED_PROVIDERS, providers);
  }

  /**
   * Enable all providers
   */
  enableAllProviders(): void {
    mainStorage.setObject(ProvidersKeys.DISABLED_PROVIDERS, []);
  }

  /**
   * Toggle provider enabled/disabled status
   */
  toggleProvider(providerId: string): string[] {
    const disabledProviders = this.getDisabledProviders();

    const newDisabled = disabledProviders.includes(providerId)
      ? disabledProviders.filter(id => id !== providerId)
      : [...disabledProviders, providerId];

    this.setDisabledProviders(newDisabled);
    return newDisabled;
  }

  /**
   * Check if a provider is disabled
   */
  isProviderDisabled(providerId: string): boolean {
    const disabledProviders = this.getDisabledProviders();
    return disabledProviders.includes(providerId);
  }
}

// Export a singleton instance
export const providersStorage = new ProvidersStorage();

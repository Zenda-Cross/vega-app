import axios from 'axios';
import {
  extensionStorage,
  ProviderExtension,
  ProviderModule,
} from '../storage/extensionStorage';

/**
 * Extension manager service for handling dynamic provider loading
 */
export class ExtensionManager {
  private static instance: ExtensionManager;
  private baseUrl =
    'https://raw.githubusercontent.com/Zenda-Cross/vega-providers/refs/heads/main';
  private manifestUrl = `${this.baseUrl}/manifest.json`;

  static getInstance(): ExtensionManager {
    if (!ExtensionManager.instance) {
      ExtensionManager.instance = new ExtensionManager();
    }
    return ExtensionManager.instance;
  }

  /**
   * Fetch latest manifest from GitHub
   */
  async fetchManifest(force = false): Promise<ProviderExtension[]> {
    try {
      // Check cache first
      if (!force && !extensionStorage.isManifestCacheExpired()) {
        const cached = extensionStorage.getManifestCache();
        if (cached.length > 0) {
          return cached;
        }
      }

      console.log('Fetching manifest from:', this.manifestUrl);
      const response = await axios.get(this.manifestUrl, {
        timeout: 10000,
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid manifest format');
      }

      const providers: ProviderExtension[] = response.data.map((item: any) => ({
        value: item.value,
        display_name: item.display_name,
        version: item.version,
        icon: item.icon || '',
        type: item.type || 'global',
        installed: false,
      }));

      // Cache the manifest
      extensionStorage.setManifestCache(providers);
      extensionStorage.setAvailableProviders(providers);

      return providers;
    } catch (error) {
      console.error('Failed to fetch manifest:', error);

      // Return cached data if available
      const cached = extensionStorage.getManifestCache();
      if (cached.length > 0) {
        return cached;
      }

      throw error;
    }
  }

  /**
   * Download and cache provider modules
   */
  async downloadProviderModules(
    providerValue: string,
    version: string,
  ): Promise<ProviderModule> {
    try {
      const requiredFiles = ['posts', 'meta', 'stream', 'catalog'];
      const optionalFiles = ['episodes'];
      const allFiles = [...requiredFiles, ...optionalFiles];

      const modules: Record<string, string> = {};
      const downloadPromises = allFiles.map(async fileName => {
        try {
          const url = `${this.baseUrl}/dist/${providerValue}/${fileName}.js`;
          console.log(`Downloading: ${url}`);

          const response = await axios.get(url, {
            timeout: 15000,
          });

          if (response.data) {
            modules[fileName] = response.data;
          }
        } catch (error) {
          // Only log error for required files
          if (requiredFiles.includes(fileName)) {
            console.error(
              `Failed to download ${fileName}.js for ${providerValue}:`,
              error,
            );
            throw error;
          } else {
            console.warn(
              `Optional file ${fileName}.js not found for ${providerValue}`,
            );
          }
        }
      });

      await Promise.all(downloadPromises);

      // Verify required files were downloaded
      const missingRequired = requiredFiles.filter(file => !modules[file]);
      if (missingRequired.length > 0) {
        throw new Error(
          `Missing required files: ${missingRequired.join(', ')}`,
        );
      }

      const providerModule: ProviderModule = {
        value: providerValue,
        version,
        modules: {
          posts: modules.posts,
          meta: modules.meta,
          stream: modules.stream,
          catalog: modules.catalog,
          episodes: modules.episodes,
        },
        cachedAt: Date.now(),
      };

      // Cache the modules
      extensionStorage.cacheProviderModules(providerModule);

      return providerModule;
    } catch (error) {
      console.error(`Failed to download modules for ${providerValue}:`, error);
      throw error;
    }
  }

  /**
   * Install a provider
   */
  async installProvider(provider: ProviderExtension): Promise<void> {
    try {
      // Download the provider modules
      await this.downloadProviderModules(provider.value, provider.version);

      // Mark as installed
      extensionStorage.installProvider(provider);

      console.log(`Successfully installed provider: ${provider.display_name}`);
    } catch (error) {
      console.error(
        `Failed to install provider ${provider.display_name}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Uninstall a provider
   */
  uninstallProvider(providerValue: string): void {
    extensionStorage.uninstallProvider(providerValue);
    console.log(`Uninstalled provider: ${providerValue}`);
  }

  /**
   * Update a provider
   */
  async updateProvider(provider: ProviderExtension): Promise<void> {
    try {
      // Download updated modules
      await this.downloadProviderModules(provider.value, provider.version);

      // Update installation record
      extensionStorage.installProvider(provider);

      console.log(`Successfully updated provider: ${provider.display_name}`);
    } catch (error) {
      console.error(
        `Failed to update provider ${provider.display_name}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get cached provider modules
   */
  getProviderModules(providerValue: string): ProviderModule | undefined {
    return extensionStorage.getProviderModules(providerValue);
  }

  /**
   * Check if provider needs update
   */
  checkForUpdates(): ProviderExtension[] {
    return extensionStorage.getProvidersNeedingUpdate();
  }
  /**
   * Execute provider module code
   * This is a placeholder - actual implementation would require a JavaScript engine
   */
  executeProviderModule(
    module: string,
    functionName: string,
    ..._args: any[]
  ): any {
    // TODO: Implement JavaScript execution using a secure runtime
    // This would use something like Hermes or V8 to safely execute the downloaded code
    console.warn('Module execution not yet implemented:', functionName);
    return null;
  }

  /**
   * Initialize extension system
   */
  async initialize(): Promise<void> {
    try {
      // Load providers from cache
      const installed = extensionStorage.getInstalledProviders();
      const available = extensionStorage.getAvailableProviders();

      console.log(`Loaded ${installed.length} installed providers`);
      console.log(`Loaded ${available.length} available providers`);

      // Try to fetch latest manifest if cache is expired
      if (extensionStorage.isManifestCacheExpired()) {
        try {
          await this.fetchManifest(false);
        } catch (error) {
          console.warn('Failed to refresh manifest on startup:', error);
        }
      }
    } catch (error) {
      console.error('Failed to initialize extension system:', error);
    }
  }
}

/**
 * Global extension manager instance
 */
export const extensionManager = ExtensionManager.getInstance();

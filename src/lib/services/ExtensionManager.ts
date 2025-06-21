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
  private baseUrlTestMode = 'http://localhost:3001';
  private manifestUrl = `${this.baseUrl}/manifest.json`;

  // Test mode configuration
  private testMode = false; // process.env.NODE_ENV === 'development'
  private testModuleCacheExpiry = 200000;
  private testModuleCache = new Map<
    string,
    {module: ProviderModule; cachedAt: number}
  >();

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

      const manifestUrl = this.testMode
        ? `${this.baseUrlTestMode}/manifest.json`
        : this.manifestUrl;
      console.log('Fetching manifest from:', manifestUrl);
      const response = await axios.get(manifestUrl, {
        timeout: 10000,
      });

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid manifest format');
      }

      const providers: ProviderExtension[] = response.data.map((item: any) => ({
        value: item.value,
        display_name: item.display_name,
        disabled: item.disabled || false,
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

  async downloadTestProviderModule(
    providerValue: string,
  ): Promise<ProviderModule> {
    try {
      const url = `${this.baseUrlTestMode}/dist/${providerValue}/`;
      const requiredFiles = ['posts', 'meta', 'stream', 'catalog'];
      const optionalFiles = ['episodes'];
      const allFiles = [...requiredFiles, ...optionalFiles];
      const modules: Record<string, string> = {};
      const downloadPromises = allFiles.map(async fileName => {
        try {
          const fileUrl = `${url}${fileName}.js`;
          console.log(`Downloading test module: ${fileUrl}`);

          const response = await axios.get(fileUrl, {
            timeout: 15000,
          });

          if (response.data) {
            modules[fileName] = response.data;
          } else {
            throw new Error(`No data received for ${fileName}`);
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

      if (!modules.posts) {
        throw new Error(`No data received for ${providerValue}`);
      }

      const providerModule: ProviderModule = {
        value: providerValue,
        version: 'test',
        modules: {
          posts: modules.posts,
          meta: modules.meta,
          stream: modules.stream,
          catalog: modules.catalog,
          episodes: modules.episodes,
        },
        cachedAt: Date.now(),
      };

      // Cache the test module
      this.testModuleCache.set(providerValue, {
        module: providerModule,
        cachedAt: Date.now(),
      });

      return providerModule;
    } catch (error) {
      console.error(
        `Failed to download test module for ${providerValue}:`,
        error,
      );
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
   * Get cached provider modules (works synchronously for both normal and test mode)
   */
  getProviderModules(providerValue: string): ProviderModule | undefined {
    if (this.testMode) {
      // In test mode, return cached test module and trigger background refresh
      const cached = this.testModuleCache.get(providerValue);
      if (cached) {
        // Trigger background refresh for next call
        this.refreshTestModuleInBackground(providerValue);

        return cached.module;
      }
      this.refreshTestModuleInBackground(providerValue);

      // If no test cache exists, fall back to regular cache
      console.warn(
        `No test module cache found for ${providerValue}, falling back to regular cache`,
      );
    }

    return extensionStorage.getProviderModules(providerValue);
  }

  /**
   * Check if provider needs update
   */
  checkForUpdates(): ProviderExtension[] {
    return extensionStorage.getProvidersNeedingUpdate();
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

  /**
   * Enable/disable test mode
   */
  setTestMode(enabled: boolean): void {
    this.testMode = enabled;
    console.log(`Test mode ${enabled ? 'enabled' : 'disabled'}`);
  }
  /**
   * Check if test module cache is expired
   */
  private isTestModuleCacheExpired(providerValue: string): boolean {
    const cached = this.testModuleCache.get(providerValue);
    if (!cached) {
      return true;
    }

    return Date.now() - cached.cachedAt > this.testModuleCacheExpiry;
  }
  /**
   * Pre-fetch test modules to ensure they're available synchronously
   */
  async preFetchTestModules(providerValues: string[]): Promise<void> {
    if (!this.testMode) {
      return;
    }

    console.log('Pre-fetching test modules for:', providerValues);

    const fetchPromises = providerValues.map(async providerValue => {
      try {
        const module = await this.downloadTestProviderModule(providerValue);
        this.testModuleCache.set(providerValue, {
          module,
          cachedAt: Date.now(),
        });
        console.log(`Pre-fetched test module for: ${providerValue}`);
      } catch (error) {
        console.error(
          `Failed to pre-fetch test module for ${providerValue}:`,
          error,
        );
      }
    });

    await Promise.allSettled(fetchPromises);
  }
  /**
   * Refresh test module in background if needed
   */
  private refreshTestModuleInBackground(providerValue: string): void {
    if (!this.testMode) {
      return;
    }

    // Refresh in background without blocking
    this.downloadTestProviderModule(providerValue)
      .then(module => {
        this.testModuleCache.set(providerValue, {
          module,
          cachedAt: Date.now(),
        });
        console.log(`Background refreshed test module for: ${providerValue}`);
      })
      .catch(error => {
        console.error(
          `Failed to background refresh test module for ${providerValue}:`,
          error,
        );
      });
  }
}

/**
 * Global extension manager instance
 */
export const extensionManager = ExtensionManager.getInstance();

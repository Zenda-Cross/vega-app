import {create} from 'zustand';
import {persist, createJSONStorage} from 'zustand/middleware';
import {MMKVLoader} from 'react-native-mmkv-storage';
// import {ProvidersList, providersList} from '../constants';
import {extensionStorage, ProviderExtension} from '../storage/extensionStorage';

const storage = new MMKVLoader().initialize();

export interface Content {
  provider: ProviderExtension;
  setProvider: (type: ProviderExtension) => void;
  // Extension-based provider management
  installedProviders: ProviderExtension[];
  availableProviders: ProviderExtension[];
  setInstalledProviders: (providers: ProviderExtension[]) => void;
  setAvailableProviders: (providers: ProviderExtension[]) => void;
  activeExtensionProvider: ProviderExtension | null;
  setActiveExtensionProvider: (provider: ProviderExtension | null) => void;
}

const useContentStore = create<Content>()(
  persist(
    (set, _get) => ({
      provider: {
        value: '',
        display_name: '',
        type: 'global',
        installed: false,
        disabled: false,
        version: '0.0.1',
        icon: '',
        installedAt: 0,
        lastUpdated: 0,
      },
      installedProviders: extensionStorage
        .getInstalledProviders()
        .sort((a, b) => a.display_name.localeCompare(b.display_name)),
      availableProviders: [],
      activeExtensionProvider: null,

      setProvider: (provider: ProviderExtension) => set({provider}),

      setInstalledProviders: (providers: ProviderExtension[]) =>
        set({
          installedProviders: providers.sort((a, b) =>
            a.display_name.localeCompare(b.display_name),
          ),
        }),

      setAvailableProviders: (providers: ProviderExtension[]) =>
        set({availableProviders: providers}),

      setActiveExtensionProvider: (provider: ProviderExtension | null) =>
        set({activeExtensionProvider: provider}),
    }),
    {
      name: 'content-storage',
      storage: createJSONStorage(() => storage as any), // Only persist certain fields
      partialize: state => ({
        provider: state.provider,
        activeExtensionProvider: state.activeExtensionProvider,
      }),
    },
  ),
);

export default useContentStore;

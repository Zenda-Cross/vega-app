import {ToastAndroid} from 'react-native';
import {providerContext} from '../providers/providerContext';
import {Catalog, EpisodeLink, Info, Post} from '../providers/types';
import {extensionManager} from './ExtensionManager';

export class ProviderManager {
  private createExecutionContext() {
    return {
      exports: {},
      require: () => ({}), // Mock require function
      module: {exports: {}},
      console,
      Promise,
      __awaiter: (thisArg: any, _arguments: any, P: any, generator: any) => {
        function adopt(value: any) {
          return value instanceof P
            ? value
            : new P(function (resolve: any) {
                resolve(value);
              });
        }
        return new (P || (P = Promise))(function (resolve: any, reject: any) {
          function fulfilled(value: any) {
            try {
              step(generator.next(value));
            } catch (e) {
              reject(e);
            }
          }
          function rejected(value: any) {
            try {
              step(generator.throw(value));
            } catch (e) {
              reject(e);
            }
          }
          function step(result: any) {
            result.done
              ? resolve(result.value)
              : adopt(result.value).then(fulfilled, rejected);
          }
          step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
      },
      Object,
    };
  }

  private executeModule(moduleCode: string, ...args: any[]): any {
    const context = this.createExecutionContext();

    const executeModule = new Function(
      'context',
      ...Array.from({length: args.length}, (_, i) => `arg${i}`),
      `
      const exports = context.exports;
      const __awaiter = context.__awaiter;
      const Object = context.Object;
      const console = context.console;
      const Promise = context.Promise;
      
      ${moduleCode}
      
      return exports;
      `,
    );
    return executeModule(context, ...args);
  }
  getCatalog = ({providerValue}: {providerValue: string}): Catalog[] => {
    // Use extensionManager which now handles test mode automatically
    const catalogModule =
      extensionManager.getProviderModules(providerValue)?.modules.catalog;
    if (!catalogModule) {
      return [];
    }
    try {
      const moduleExports = this.executeModule(catalogModule);

      // Return the catalog array directly from exports
      return moduleExports.catalog || [];
    } catch (error) {
      console.error('Error loading catalog:', error);
      console.error('Module content:', catalogModule);
      throw new Error(`Invalid catalog module for provider: ${providerValue}`);
    }
  };
  getGenres = ({providerValue}: {providerValue: string}): Catalog[] => {
    // Use extensionManager which now handles test mode automatically
    const catalogModule =
      extensionManager.getProviderModules(providerValue)?.modules.catalog;
    if (!catalogModule) {
      return [];
    }
    try {
      const moduleExports = this.executeModule(catalogModule);

      // Return the genres array directly from exports
      return moduleExports.genres || [];
    } catch (error) {
      console.error('Error loading genres:', error);
      console.error('Module content:', catalogModule);
      throw new Error(`Invalid catalog module for provider: ${providerValue}`);
    }
  };
  getPosts = async ({
    filter,
    page,
    providerValue,
    signal,
  }: {
    filter: string;
    page: number;
    providerValue: string;
    signal: AbortSignal;
  }): Promise<Post[]> => {
    // Use extensionManager which now handles test mode automatically
    const getPostsModule =
      extensionManager.getProviderModules(providerValue)?.modules.posts;
    if (!getPostsModule) {
      throw new Error(`No posts module found for provider: ${providerValue}`);
    }
    try {
      const moduleExports = this.executeModule(
        getPostsModule,
        filter,
        page,
        providerValue,
        signal,
        providerContext,
      );

      // Call the getPosts function
      return await moduleExports.getPosts({
        filter,
        page,
        providerValue,
        signal,
        providerContext,
      });
    } catch (error) {
      console.error('Error creating posts function:', error);
      console.error('Module content:', getPostsModule);
      throw new Error(`Invalid posts module for provider: ${providerValue}`);
    }
  };
  getSearchPosts = async ({
    searchQuery,
    page,
    providerValue,
    signal,
  }: {
    searchQuery: string;
    page: number;
    providerValue: string;
    signal: AbortSignal;
  }): Promise<Post[]> => {
    // Use extensionManager which now handles test mode automatically
    const getPostsModule =
      extensionManager.getProviderModules(providerValue)?.modules.posts;
    if (!getPostsModule) {
      throw new Error(`No posts module found for provider: ${providerValue}`);
    }
    try {
      const moduleExports = this.executeModule(
        getPostsModule,
        searchQuery,
        page,
        providerValue,
        signal,
        providerContext,
      );

      // Call the getSearchPosts function
      return await moduleExports.getSearchPosts({
        searchQuery,
        page,
        providerValue,
        signal,
        providerContext,
      });
    } catch (error) {
      console.error('Error creating search posts function:', error);
      console.error('Module content:', getPostsModule);
      throw new Error(`Invalid posts module for provider: ${providerValue}`);
    }
  };
  getMetaData = async ({
    link,
    provider,
  }: {
    link: string;
    provider: string;
  }): Promise<Info> => {
    // Use extensionManager which now handles test mode automatically
    const getMetaDataModule =
      extensionManager.getProviderModules(provider)?.modules.meta;
    if (!getMetaDataModule) {
      throw new Error(`No meta data module found for provider: ${provider}`);
    }
    try {
      const moduleExports = this.executeModule(
        getMetaDataModule,
        link,
        provider,
        providerContext,
      );

      // Call the getMetaData function
      return await moduleExports.getMeta({
        link,
        provider,
        providerContext,
      });
    } catch (error) {
      console.error('Error creating meta data function:', error);
      console.error('Module content:', getMetaDataModule);
      throw new Error(`Invalid meta data module for provider: ${provider}`);
    }
  };
  getStream = async ({
    link,
    type,
    signal,
    providerValue,
  }: {
    link: string;
    type: string;
    signal: AbortSignal;
    providerValue: string;
  }): Promise<any[]> => {
    // Use extensionManager which now handles test mode automatically
    const getStreamModule =
      extensionManager.getProviderModules(providerValue)?.modules.stream;
    if (!getStreamModule) {
      throw new Error(`No stream module found for provider: ${providerValue}`);
    }
    try {
      const moduleExports = this.executeModule(
        getStreamModule,
        link,
        type,
        signal,
        providerContext,
      );

      // Call the getStream function
      return await moduleExports.getStream({
        link,
        type,
        signal,
        providerContext,
      });
    } catch (error) {
      console.error('Error creating stream function:', error);
      console.error('Module content:', getStreamModule);
      throw new Error(`Invalid stream module for provider: ${providerValue}`);
    }
  };
  getEpisodes = async ({
    url,
    providerValue,
  }: {
    url: string;
    providerValue: string;
  }): Promise<EpisodeLink[]> => {
    // Use extensionManager which now handles test mode automatically
    const getEpisodeLinksModule =
      extensionManager.getProviderModules(providerValue)?.modules.episodes;
    if (!getEpisodeLinksModule) {
      throw new Error(
        `No episode links module found for provider: ${providerValue}`,
      );
    }
    try {
      const moduleExports = this.executeModule(
        getEpisodeLinksModule,
        url,
        providerContext,
      );

      // Call the getEpisodes function
      return await moduleExports.getEpisodes({
        url,
        providerContext,
      });
    } catch (error) {
      console.error('Error creating episode links function:', error);
      console.error('Module content:', getEpisodeLinksModule);
      ToastAndroid.show(
        `Invalid episode links module for provider: ${providerValue}`,
        ToastAndroid.LONG,
      );
      throw new Error(
        `Invalid episode links module for provider: ${providerValue}`,
      );
    }
  };
}

export const providerManager = new ProviderManager();

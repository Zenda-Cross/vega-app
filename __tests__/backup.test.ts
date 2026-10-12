import {beforeEach, describe, expect, it, jest} from '@jest/globals';

const mockValues = new Map<string, unknown>();
const mockContentState = {
  provider: {value: ''} as any,
  setProvider: jest.fn((provider: any) => {
    mockContentState.provider = provider;
  }),
  setInstalledProviders: jest.fn(),
};
const mockSetThemeState = jest.fn();
const mockSetLibraryState = jest.fn();
jest.mock('../src/lib/zustand/watchListStore', () => ({
  __esModule: true, default: {setState: (state: unknown) => mockSetLibraryState(state)},
}));

jest.mock('../src/lib/storage/StorageService', () => ({
  mainStorage: {
    hasKey: (key: string) => mockValues.has(key),
    getBool: (key: string, defaultValue = false) =>
      mockValues.has(key) ? mockValues.get(key) : defaultValue,
    setBool: (key: string, value: boolean) => mockValues.set(key, value),
    getString: (key: string) => mockValues.get(key),
    setString: (key: string, value: string) => mockValues.set(key, value),
    getNumber: (key: string) => mockValues.get(key),
    setNumber: (key: string, value: number) => mockValues.set(key, value),
    getArray: (key: string) => mockValues.get(key),
    setArray: (key: string, value: unknown[]) => mockValues.set(key, value),
    delete: (key: string) => mockValues.delete(key),
  },
}));

jest.mock('../src/lib/downloadLocation', () => ({
  getDownloadLocationDisplayValue: () => 'Not selected',
  parseDownloadLocation: () => null,
  serializeDownloadLocation: () => '',
}));

jest.mock('../src/lib/zustand/contentStore', () => ({
  __esModule: true,
  default: {getState: () => mockContentState},
}));

jest.mock('../src/lib/zustand/themeStore', () => ({
  __esModule: true,
  default: {setState: (state: unknown) => mockSetThemeState(state)},
}));

jest.mock('expo-document-picker', () => ({getDocumentAsync: jest.fn()}));
jest.mock('expo-file-system/legacy', () => ({
  StorageAccessFramework: {},
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
}));

import {
  BACKUP_VERSION,
  createBackup,
  parseBackup,
  restoreBackup,
} from '../src/lib/backup';

const provider = {
  value: 'vega',
  display_name: 'Vega',
  type: 'global',
  installed: true,
  disabled: false,
  version: '1.0.0',
  icon: '',
  source: {author: 'vega', url: 'https://example.com'},
};

describe('backup', () => {
  beforeEach(() => {
    mockValues.clear();
    mockContentState.provider = {value: ''};
    jest.clearAllMocks();
  });

  it('includes only saved settings and skips device specific ones', () => {
    mockValues.set('hapticFeedback', false);
    mockValues.set('useExternalPlayer', true);
    mockValues.set('subtitleFontSize', 20);
    mockValues.set('seekInterval', 30);
    mockValues.set('playbackSpeed', 1.5);
    mockValues.set('excludedQualities', ['480p']);
    mockValues.set('autoPlayNextEpisode', true);
    mockValues.set('forwardBufferMB', 128);
    mockValues.set('backBufferMB', 32);
    mockValues.set('downloadConnections', 8);
    mockValues.set('parallelStreaming', true);
    mockValues.set('subtitleTextOpacity', 0.8);
    mockValues.set('alwaysCastMode', true);
    mockValues.set('askLocalFileFirst', true);
    mockValues.set('downloadLocation', 'content://tree/primary');
    mockValues.set('launcherIcon', 'dark');

    const backup = createBackup();

    expect(backup.app).toBe('vega');
    expect(backup.version).toBe(BACKUP_VERSION);
    expect(backup.settings).toEqual({
      hapticFeedback: false,
      useExternalPlayer: true,
      subtitleFontSize: 20,
      seekInterval: 30,
      playbackSpeed: 1.5,
      excludedQualities: ['480p'],
      autoPlayNextEpisode: true,
      downloadConnections: 8,
      parallelStreaming: true,
      subtitleTextOpacity: 0.8,
      alwaysCastMode: true,
      askLocalFileFirst: true,
    });
  });

  it('restores settings, providers and the selected provider', () => {
    mockValues.set('hapticFeedback', false);
    mockValues.set('installedProviders', [provider]);
    mockValues.set('providerSources', [
      {author: 'vega', url: 'https://example.com'},
    ]);
    mockValues.set('providerModules', [
      {value: 'vega', version: '1.0.0', modules: {posts: 'code'}, cachedAt: 1},
    ]);
    mockValues.set('disabledProviders', ['other']);
    mockContentState.provider = provider;

    const backup = parseBackup(JSON.stringify(createBackup()));
    mockValues.clear();
    mockContentState.provider = {value: ''};

    restoreBackup(backup);

    expect(mockValues.get('hapticFeedback')).toBe(false);
    expect(mockValues.get('installedProviders')).toEqual([provider]);
    expect(mockValues.get('providerSources')).toHaveLength(1);
    expect(mockValues.get('providerModules')).toHaveLength(1);
    expect(mockValues.get('disabledProviders')).toEqual(['other']);
    expect(mockContentState.setInstalledProviders).toHaveBeenCalledWith([
      provider,
    ]);
    expect(mockContentState.provider).toEqual(provider);
    expect(mockSetThemeState.mock.invocationCallOrder[0]).toBeLessThan(
      mockContentState.setProvider.mock.invocationCallOrder[0],
    );
  });

  it('ignores settings with the wrong type and unknown keys', () => {
    restoreBackup({
      app: 'vega',
      version: BACKUP_VERSION,
      createdAt: '',
      settings: {
        hapticFeedback: 'yes',
        subtitleFontSize: 18,
        playbackSpeed: 1.25,
        downloadLocation: 'content://tree/primary',
        somethingElse: true,
      },
      providers: {installed: [], sources: [], modules: []},
    });

    expect(mockValues.has('hapticFeedback')).toBe(false);
    expect(mockValues.get('subtitleFontSize')).toBe(18);
    expect(mockValues.get('playbackSpeed')).toBe(1.25);
    expect(mockValues.has('downloadLocation')).toBe(false);
    expect(mockValues.has('somethingElse')).toBe(false);
  });

  it('skips providers missing fields the UI needs', () => {
    const withoutType = {...provider, type: undefined};

    restoreBackup({
      app: 'vega',
      version: BACKUP_VERSION,
      createdAt: '',
      settings: {},
      providers: {
        installed: [provider, withoutType as any],
        sources: [],
        modules: [],
      },
    });

    expect(mockValues.get('installedProviders')).toEqual([provider]);
  });

  it('round trips titles, categories and assignments and updates the live library', () => {
    const library = {
      items: [{title: 'Saved show', poster: 'poster', link: 'episode', provider: 'vega', collections: ['custom']}],
      collections: [{id: 'custom', name: 'Favorites', icon: 'star', color: '#123456', createdAt: 1, updatedAt: 2}],
    };
    mockValues.set('watchlist', library.items);
    mockValues.set('library-collections', library.collections);
    mockValues.set('library-default-collection-added', true);
    const backup = parseBackup(JSON.stringify(createBackup()));
    expect(backup.library).toEqual(library);
    mockValues.clear();
    restoreBackup(backup);
    expect(mockValues.get('watchlist')).toEqual(library.items);
    expect(mockValues.get('library-collections')).toEqual(library.collections);
    expect(mockValues.get('library-default-collection-added')).toBe(true);
    expect(mockSetLibraryState).toHaveBeenCalledWith({watchList: library.items, collections: library.collections});
  });

  it('leaves the library alone when restoring an older backup', () => {
    const backup = createBackup();
    delete backup.library;
    mockValues.set('watchlist', ['existing']);
    restoreBackup(backup);
    expect(mockValues.get('watchlist')).toEqual(['existing']);
    expect(mockSetLibraryState).not.toHaveBeenCalled();
  });

  it('restores an empty library without recreating the default category', () => {
    const backup = createBackup();
    backup.library = {items: [], collections: []};
    restoreBackup(backup);
    expect(mockValues.get('library-collections')).toEqual([]);
    expect(mockValues.get('library-default-collection-added')).toBe(true);
  });

  it('rejects malformed library before changing settings', () => {
    const backup = createBackup();
    backup.library = {items: [null], collections: []} as any;
    backup.settings.hapticFeedback = true;
    expect(() => parseBackup(JSON.stringify(backup))).toThrow('invalid library');
    expect(() => restoreBackup(backup)).toThrow('invalid library');
    expect(mockValues.has('hapticFeedback')).toBe(false);
  });

  it('rejects files that are not a Vega backup', () => {
    expect(() => parseBackup('not json')).toThrow('not a Vega backup');
    expect(() => parseBackup('{"app":"other","version":1}')).toThrow(
      'not a Vega backup',
    );
    expect(() =>
      parseBackup(JSON.stringify({app: 'vega', version: BACKUP_VERSION + 1})),
    ).toThrow('newer version');
    expect(() =>
      parseBackup(JSON.stringify({app: 'vega', version: BACKUP_VERSION})),
    ).toThrow('incomplete');
  });
});

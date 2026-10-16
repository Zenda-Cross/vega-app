import {beforeEach, describe, expect, it, jest} from '@jest/globals';

// One shared SAF folder; every phone gets its own modules and storage.
const mockFiles = new Map<string, string>();
const mockDirectories = new Set<string>(['content://tree']);
let mockUuid = 0;

jest.mock('expo-crypto', () => ({
  randomUUID: () => `device-${++mockUuid}`,
}));

jest.mock('expo-file-system/legacy', () => ({
  StorageAccessFramework: {
    readDirectoryAsync: async (uri: string) =>
      [...mockDirectories, ...mockFiles.keys()].filter(
        child => child.slice(0, child.lastIndexOf('/')) === uri,
      ),
    makeDirectoryAsync: async (uri: string, name: string) => {
      mockDirectories.add(`${uri}/${name}`);
      return `${uri}/${name}`;
    },
    createFileAsync: async (uri: string, name: string) => {
      mockFiles.set(`${uri}/${name}`, '');
      return `${uri}/${name}`;
    },
    writeAsStringAsync: async (uri: string, content: string) => {
      mockFiles.set(uri, content);
    },
    readAsStringAsync: async (uri: string) => mockFiles.get(uri) ?? '',
  },
}));

jest.mock('../src/lib/storage/StorageService', () => {
  const makeStorage = () => {
    const values = new Map<string, unknown>();
    const get = (key: string) => values.get(key);
    const set = (key: string, value: unknown) => {
      values.set(key, JSON.parse(JSON.stringify(value)));
    };
    return {
      values,
      getString: get,
      setString: set,
      getNumber: get,
      setNumber: set,
      getObject: get,
      setObject: set,
      getArray: get,
      setArray: set,
    };
  };
  return {mainStorage: makeStorage(), cacheStorage: makeStorage()};
});

jest.mock('../src/lib/storage/WatchListStorage', () => {
  const {mainStorage} = require('../src/lib/storage/StorageService');
  return {
    WatchListKeys: {WATCH_LIST: 'watchlist'},
    watchListStorage: {
      getWatchList: () => mainStorage.getArray('watchlist') || [],
      getCollections: () => [],
      saveCollections: () => undefined,
    },
  };
});

jest.mock('../src/lib/storage', () => ({
  settingsStorage: {
    getDownloadLocationConfig: () => ({type: 'saf', uri: 'content://tree'}),
  },
}));

jest.mock('../src/lib/downloadLocation', () => ({
  getSafEntryName: (uri?: string) => uri?.split('/').pop() || '',
  isSafDownloadLocation: () => true,
}));

jest.mock('../src/lib/zustand/downloadsStore', () => ({
  __esModule: true,
  default: {getState: () => ({downloads: {}})},
}));

jest.mock('../src/lib/zustand/continueWatchingStore', () => ({
  __esModule: true,
  default: {getState: () => ({items: []})},
}));

jest.mock('../src/lib/zustand/watchListStore', () => ({
  __esModule: true,
  default: {getState: () => ({watchList: [], collections: []})},
}));

type Phone = {
  storage: {values: Map<string, unknown>};
  publish: () => Promise<void>;
  setWatchList: (links: string[]) => void;
};

let mockHardwareId = '';
jest.mock('react-native', () => ({
  NativeModules: {
    VegaSyncStorage: {
      deviceId: mockHardwareId,
      writeManifest: async (uri: string, content: string) => {
        mockFiles.set(uri, content);
      },
    },
  },
}));

const installApp = (hardwareId: string): Phone => {
  mockHardwareId = hardwareId;
  let phone: Phone | undefined;
  jest.isolateModules(() => {
    const storage = require('../src/lib/storage/StorageService').mainStorage;
    phone = {
      storage,
      publish: require('../src/lib/sync/syncService').publishSyncManifest,
      setWatchList: links => storage.setArray('watchlist', links.map(link => ({
        title: link, link, provider: 'p', poster: '', updatedAt: 1,
      }))),
    };
  });
  return phone!;
};

const manifests = () => [...mockFiles.values()].map(content => JSON.parse(content));

describe('stable sync device identity', () => {
  beforeEach(() => {
    mockFiles.clear();
    mockDirectories.clear();
    mockDirectories.add('content://tree');
    mockUuid = 0;
  });

  it('keeps two phones separate even when Auto Backup copied the old device id', async () => {
    const a = installApp('hardware-a');
    a.setWatchList(['a']);
    await a.publish();
    const backup = new Map(a.storage.values);
    const b = installApp('hardware-b');
    backup.forEach((value, key) => b.storage.values.set(key, value));
    b.setWatchList(['b']);
    await b.publish();
    a.setWatchList(['a-new']);
    await a.publish();
    expect(manifests().map(file => file.deviceId).sort()).toEqual(['hardware-a', 'hardware-b']);
    expect(Object.keys(manifests().find(file => file.deviceId === 'hardware-a').watchlist)).toEqual(['a-new']);
    expect(Object.keys(manifests().find(file => file.deviceId === 'hardware-b').watchlist)).toEqual(['b']);
  });

  it('does not create a device when Syncthing restores an older revision', async () => {
    const phone = installApp('hardware-a');
    await phone.publish();
    const [uri, first] = [...mockFiles.entries()][0];
    await phone.publish();
    mockFiles.set(uri, first);
    await phone.publish();
    expect(manifests()).toHaveLength(1);
    expect(manifests()[0].deviceId).toBe('hardware-a');
    expect(manifests()[0].revision).toBe(3);
  });

  it('reuses its hardware identity across updates with restored local state', async () => {
    const old = installApp('hardware-a');
    await old.publish();
    const state = new Map(old.storage.values);
    const updated = installApp('hardware-a');
    state.forEach((value, key) => updated.storage.values.set(key, value));
    await updated.publish();
    expect(manifests()).toHaveLength(1);
    expect(manifests()[0].revision).toBe(2);
  });

  it('serializes overlapping publishes without rotating identity or reordering revisions', async () => {
    const phone = installApp('hardware-a');
    await Promise.all(Array.from({length: 10}, () => phone.publish()));
    expect(manifests()).toHaveLength(1);
    expect(manifests()[0].revision).toBe(10);
  });
  it('preserves an existing installation id when upgrading from before device binding', async () => {
    const phone = installApp('hardware-a');
    phone.storage.values.set('vega-sync-device-id', 'legacy-device-id');
    phone.storage.values.set('vega-sync-published-revision', 500);
    await phone.publish();
    await phone.publish();
    expect(manifests()).toHaveLength(1);
    expect(manifests()[0].deviceId).toBe('legacy-device-id');
  });

});

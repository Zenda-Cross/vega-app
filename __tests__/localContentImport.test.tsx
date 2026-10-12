import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Modal} from 'react-native';

let mockIsTV = false;
jest.mock('../src/lib/tv/constants', () => ({
  get isTV() {
    return mockIsTV;
  },
}));
jest.mock('../src/lib/tv/useTVNavFocusMemory', () => ({
  useSafeIsNavFocused: () => true,
}));

jest.mock(
  '@expo/vector-icons/MaterialCommunityIcons',
  () => 'MaterialCommunityIcons',
);

jest.mock('@expo/ui/jetpack-compose', () => ({
  Host: 'Host',
  Switch: 'ExpoSwitch',
}));

jest.mock('../src/lib/storage/StorageService', () => {
  const values = new Map<string, string>();
  return {
    createZustandStorage: () => ({
      getItem: (key: string) => values.get(key) || null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    }),
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0}),
}));
jest.mock('../src/theme/M3PaletteContext', () => ({
  useM3HostTheme: () => ({}),
  useM3Colors: () => ({
    background: '#000',
    onSurface: '#fff',
    primary: '#abc',
    onPrimary: '#123',
    error: '#f00',
  }),
}));
jest.mock('../src/components/ui/DropdownField', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../src/components/tv', () => {
  const ReactMock = require('react');
  const {Pressable} = require('react-native');
  return {
    TVFocusable: ReactMock.forwardRef((props: any, ref: any) =>
      ReactMock.createElement(Pressable, {...props, ref}),
    ),
    TVFocusGuide: (props: any) => ReactMock.createElement('TVFocusGuide', props),
  };
});
jest.mock('../src/lib/localContent/files', () => ({
  pickLocalFolder: jest.fn(),
  listLocalFolder: jest.fn(),
}));
jest.mock('../src/lib/localContent/metadata', () => ({
  fetchLocalMetadata: jest.fn(),
}));
jest.mock('../src/lib/services/imdbSuggestions', () => ({
  fetchIMDbSuggestions: jest.fn(async () => []),
}));
jest.mock('../src/lib/uriPermission', () => ({
  releasePersistableUriPermission: jest.fn(async () => undefined),
}));
jest.mock('../src/lib/zustand/watchListStore', () => ({
  __esModule: true,
  default: (selector: any) =>
    selector({
      collections: [
        {
          id: 'watchlist',
          name: 'Watchlist',
          icon: 'bookmark',
          color: '#123456',
        },
        {id: 'movies', name: 'Movies', icon: 'movie', color: '#654321'},
      ],
    }),
}));

jest.mock('../src/lib/storage/SettingsStorage', () => ({
  settingsStorage: {getDownloadLocationConfig: jest.fn(() => null)},
}));

import LocalContent from '../src/screens/LocalContent';
import useLocalContentStore from '../src/lib/zustand/localContentStore';
import {listLocalFolder, pickLocalFolder} from '../src/lib/localContent/files';
import {fetchLocalMetadata} from '../src/lib/localContent/metadata';
import {releasePersistableUriPermission} from '../src/lib/uriPermission';
import {settingsStorage} from '../src/lib/storage/SettingsStorage';

let tree: renderer.ReactTestRenderer;
const navigation = {navigate: jest.fn(), goBack: jest.fn()};
const press = async (label: string) => {
  await act(async () => {
    const modal = tree.root.findByType(Modal);
    const root = modal.props.visible ? modal : tree.root;
    root.findAllByProps({accessibilityLabel: label})[0].props.onPress();
  });
};
beforeEach(async () => {
  jest.clearAllMocks();
  mockIsTV = false;
  (settingsStorage.getDownloadLocationConfig as jest.Mock).mockReturnValue(
    null,
  );
  useLocalContentStore.setState({titles: []});
  (pickLocalFolder as jest.Mock).mockResolvedValue({
    uri: 'root',
    name: 'Shows',
  });
  (listLocalFolder as jest.Mock).mockImplementation(
    async (uri: string) =>
      ({
        root: [
          {uri: 'show1', name: 'First Show', directory: true},
          {uri: 'show2', name: 'Second Show', directory: true},
        ],
        show1: [
          {uri: 'file:///first.mkv', name: 'S01E01.mkv', directory: false},
        ],
        show2: [
          {uri: 'file:///second.mkv', name: 'S01E02.mkv', directory: false},
        ],
      })[uri] || [],
  );
  await act(async () => {
    tree = renderer.create(
      <LocalContent
        navigation={navigation as any}
        route={{key: 'local', name: 'LocalContent'} as any}
      />,
    );
  });
});
afterEach(() => {
  act(() => tree.unmount());
});

it('reviews a bulk import, saves all entries together, returns to Library with local category assignments', async () => {
  await press('Bulk import');
  expect(
    tree.root.findAllByProps({accessibilityLabel: 'Skip folder'}).length,
  ).toBeGreaterThan(0);
  await press('Next');
  expect(useLocalContentStore.getState().titles).toEqual([]);
  await press('Import');
  const titles = useLocalContentStore.getState().titles;
  expect(titles.map(t => t.name)).toEqual(['First Show', 'Second Show']);
  expect(titles.every(title => title.collections?.includes('watchlist'))).toBe(
    true,
  );
  expect(navigation.navigate).toHaveBeenCalledWith('WatchList');
});

it('keeps the review open after metadata failure and permits filename-only import', async () => {
  (fetchLocalMetadata as jest.Mock).mockRejectedValue(
    new Error('Metadata offline'),
  );
  await press('Import folder');
  const nameSwitch = tree.root.findByType('ExpoSwitch' as any);
  expect(nameSwitch.props.colors.checkedTrackColor).toBe('#abc');
  expect(nameSwitch.props.colors.checkedThumbColor).toBe('#123');
  await act(async () => nameSwitch.props.onCheckedChange(false));
  expect(
    tree.root.findAllByProps({accessibilityLabel: 'Skip folder'}),
  ).toHaveLength(0);
  await press('Choose movie or series');
  await press('IMDb ID');
  await act(async () => {
    tree.root
      .findAllByProps({accessibilityLabel: 'Enter IMDb ID'})[0]
      .props.onChangeText('tt123');
  });
  await press('Use IMDb ID');
  expect(useLocalContentStore.getState().titles).toEqual([]);
  expect(
    tree.root
      .findAllByProps({accessibilityRole: 'alert'})
      .some(node =>
        JSON.stringify(node.props.children).includes('Metadata offline'),
      ),
  ).toBe(true);
  await press('Back');
  await press('Import');
  expect(useLocalContentStore.getState().titles[0].episodes).toHaveLength(2);
  expect(useLocalContentStore.getState().titles[0].metadata).toBeUndefined();
  expect(useLocalContentStore.getState().titles[0].useMetadataTitles).toBe(
    false,
  );
});

it('discards a cancelled bulk review and releases its unused folder permission', async () => {
  await press('Bulk import');
  await press('Next');
  await press('Cancel');
  expect(useLocalContentStore.getState().titles).toEqual([]);
  expect(releasePersistableUriPermission).toHaveBeenCalledWith('root');
});

it('preserves the download folder permission when cancelling an import of that same folder', async () => {
  (settingsStorage.getDownloadLocationConfig as jest.Mock).mockReturnValue({
    type: 'saf',
    uri: 'root',
  });
  await press('Bulk import');
  await press('Cancel');
  expect(releasePersistableUriPermission).not.toHaveBeenCalled();
});

it('allows choosing a library category before importing', async () => {
  await press('Import folder');
  await press('Watchlist');
  await press('Movies');
  await press('Import');
  expect(useLocalContentStore.getState().titles[0].collections).toEqual([
    'movies',
  ]);
});

it('gives TV entry and each replacement view a preferred target, and hides background controls during review', async () => {
  mockIsTV = true;
  await act(async () =>
    tree.update(
      <LocalContent
        navigation={navigation as any}
        route={{key: 'local', name: 'LocalContent'} as any}
      />,
    ),
  );
  expect(
    tree.root.findAllByProps({accessibilityLabel: 'Back'})[0].props
      .hasTVPreferredFocus,
  ).toBe(true);
  await press('Import folder');
  expect(
    tree.root.findAllByProps({accessibilityLabel: 'Import folder'}),
  ).toHaveLength(0);
  expect(
    tree.root.findAllByProps({accessibilityLabel: 'Choose movie or series'})[0]
      .props.hasTVPreferredFocus,
  ).toBe(true);
  await press('Choose movie or series');
  expect(
    tree.root.findAllByProps({accessibilityLabel: 'Back'})[0].props
      .hasTVPreferredFocus,
  ).toBe(true);
  await act(async () => tree.root.findByType(Modal).props.onRequestClose());
  expect(
    tree.root.findAllByProps({accessibilityLabel: 'Choose movie or series'})[0]
      .props.hasTVPreferredFocus,
  ).toBe(true);
  expect(tree.root.findByType(Modal).props.visible).toBe(true);
  await act(async () => tree.root.findByType(Modal).props.onRequestClose());
  expect(tree.root.findByType(Modal).props.visible).toBe(false);
  expect(
    tree.root.findAllByProps({accessibilityLabel: 'Back'})[0].props
      .hasTVPreferredFocus,
  ).toBe(true);
});

it('toggles metadata names with the TV remote while the nested native switch cannot take focus', async () => {
  mockIsTV = true;
  await press('Import folder');
  const row = tree.root.findAllByProps({
    accessibilityLabel: 'Metadata names',
  })[0];
  const initial = row.props.accessibilityState.checked;
  expect(row.props.accessibilityRole).toBe('switch');
  expect(tree.root.findByType('ExpoSwitch' as any).props.enabled).toBe(false);
  await press('Metadata names');
  expect(
    tree.root.findAllByProps({accessibilityLabel: 'Metadata names'})[0].props
      .accessibilityState.checked,
  ).toBe(!initial);
});

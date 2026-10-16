jest.mock(
  '@expo/vector-icons/MaterialCommunityIcons',
  () => 'MaterialCommunityIcons',
);
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

const mockStorage = new Map<string, string>();
const mockCache = new Map<string, string>();
const mockGetMetaData = jest.fn();
jest.mock('../src/lib/storage/StorageService', () => ({
  createZustandStorage: () => ({
    getItem: (key: string) => mockStorage.get(key) || null,
    setItem: (key: string, value: string) => mockStorage.set(key, value),
    removeItem: (key: string) => mockStorage.delete(key),
  }),
}));
jest.mock('../src/lib/storage', () => ({
  cacheStorage: {
    getString: (key: string) => mockCache.get(key),
    setString: (key: string, value: string) => mockCache.set(key, value),
  },
}));
jest.mock('../src/lib/services/ProviderManager', () => ({
  providerManager: {
    getMetaData: (args: unknown) => mockGetMetaData(args),
  },
}));
jest.mock('../src/lib/localContent/files', () => ({
  listLocalFolder: jest.fn(),
}));
jest.mock('../src/lib/zustand/localContentStore', () => ({
  __esModule: true,
  default: (selector: any) => selector({titles: []}),
}));
jest.mock('axios', () => ({get: jest.fn()}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({top: 0, bottom: 0}),
}));
jest.mock('../src/theme/M3PaletteContext', () => ({
  useM3HostTheme: () => ({}),
  useM3Colors: () => ({background: '#000', surfaceContainerHigh: '#222'}),
}));
jest.mock('../src/components/tv', () => {
  const ReactMock = require('react');
  const {Pressable} = require('react-native');
  return {
    TVFocusGuide: 'TVFocusGuide',
    TVFocusable: (props: any) => ReactMock.createElement(Pressable, props),
  };
});
jest.mock('../src/components/metadata/MetadataPicker', () => {
  const ReactMock = require('react');
  const {Pressable} = require('react-native');
  return {
    MetadataPicker: 'MetadataPicker',
    ImportAction: ({label, onPress}: any) =>
      ReactMock.createElement(Pressable, {accessibilityLabel: label, onPress}),
  };
});
import ProviderMetadataDialog from '../src/components/metadata/ProviderMetadataDialog';

import axios from 'axios';
import {useContentDetails} from '../src/lib/hooks/useContentInfo';
import useMetadataOverrideStore, {
  metadataOverrideKey,
} from '../src/lib/zustand/metadataOverrideStore';
import type {LocalMetadata} from '../src/lib/localContent/model';

const link = 'https://provider.test/show';
const providerInfo = {
  title: 'Provider title',
  image: 'https://provider.test/poster',
  synopsis: 'Provider synopsis',
  type: 'series',
  populateMeta: false,
  quickDownload: true,
  linkList: [
    {title: 'Season 1', episodesLink: 'https://provider.test/season1'},
  ],
};
const metadata: LocalMetadata = {
  imdbId: 'tt123',
  type: 'series',
  title: 'Matched title',
  poster: 'https://meta.test/poster',
  background: 'https://meta.test/background',
  description: 'Matched synopsis',
  rating: '8.5',
  videos: [{season: 1, episode: 1, title: 'Pilot'}],
};
let details: ReturnType<typeof useContentDetails>;
let tree: renderer.ReactTestRenderer;
let client: QueryClient;
const Probe = () => {
  details = useContentDetails(link, 'provider');
  return null;
};
const flush = async () =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, 25));
  });

beforeEach(async () => {
  jest.clearAllMocks();
  mockCache.clear();
  mockStorage.clear();
  useMetadataOverrideStore.setState({overrides: {}});
  mockGetMetaData.mockResolvedValue(providerInfo);
  client = new QueryClient({defaultOptions: {queries: {retry: false}}});
  await act(async () => {
    tree = renderer.create(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
  });
  await flush();
});
afterEach(() => {
  act(() => tree.unmount());
  client.clear();
});

it('fills artwork, synopsis, IMDb and episode metadata even when the provider does not populate metadata', async () => {
  act(() =>
    useMetadataOverrideStore.getState().setMetadata('provider', link, metadata),
  );
  await flush();
  expect(details.info).toMatchObject({
    title: 'Matched title',
    imdbId: 'tt123',
    image: metadata.background,
    poster: metadata.poster,
    synopsis: 'Matched synopsis',
  });
  expect(details.meta).toMatchObject({
    name: 'Matched title',
    imdbRating: '8.5',
    videos: metadata.videos,
  });
  expect(details.info?.linkList).toBe(providerInfo.linkList);
  expect(details.info?.type).toBe(providerInfo.type);
  expect(details.info?.quickDownload).toBe(true);
  expect(axios.get).not.toHaveBeenCalled();
  expect(JSON.parse(mockCache.get(`contentInfo:provider:${link}`)!)).toEqual(
    providerInfo,
  );
});

it('persists the override per provider and URL and survives refreshing provider metadata', async () => {
  act(() =>
    useMetadataOverrideStore.getState().setMetadata('provider', link, metadata),
  );
  const saved = JSON.parse(mockStorage.get('provider-metadata-overrides-v1')!);
  expect(saved.state.overrides[metadataOverrideKey('provider', link)]).toEqual(
    metadata,
  );
  expect(
    saved.state.overrides[metadataOverrideKey('other', link)],
  ).toBeUndefined();
  mockGetMetaData.mockResolvedValue({
    ...providerInfo,
    title: 'New provider title',
  });
  await act(async () => {
    await details.refetch();
  });
  await flush();
  expect(details.info?.title).toBe('Matched title');
});

it('restores provider metadata when the manual match is removed', async () => {
  act(() =>
    useMetadataOverrideStore.getState().setMetadata('provider', link, metadata),
  );
  await flush();
  act(() => useMetadataOverrideStore.getState().setMetadata('provider', link));
  await flush();
  expect(details.info).toEqual(providerInfo);
  expect(details.meta).toBeNull();
  expect(useMetadataOverrideStore.getState().overrides).toEqual({});
});

it('opens the picker from More options, saves a match, and offers restoration', async () => {
  const close = jest.fn();
  let dialog!: renderer.ReactTestRenderer;
  await act(async () => {
    dialog = renderer.create(
      <ProviderMetadataDialog
        visible
        onClose={close}
        info={providerInfo}
        provider="provider"
        link={link}
      />,
    );
  });
  expect(
    dialog.root.findAllByProps({accessibilityLabel: 'Use provider metadata'}),
  ).toHaveLength(0);
  await act(async () =>
    dialog.root
      .findAllByProps({accessibilityLabel: 'Edit metadata'})[0]
      .props.onPress(),
  );
  const picker = dialog.root.findByType('MetadataPicker' as any);
  expect(picker.props.title.name).toBe(providerInfo.title);
  await act(async () => picker.props.onBack());
  expect(close).not.toHaveBeenCalled();
  await act(async () =>
    dialog.root
      .findAllByProps({accessibilityLabel: 'Edit metadata'})[0]
      .props.onPress(),
  );
  await act(async () =>
    dialog.root.findByType('MetadataPicker' as any).props.onChoose(metadata),
  );
  expect(close).toHaveBeenCalledTimes(1);
  expect(
    useMetadataOverrideStore.getState().overrides[
      metadataOverrideKey('provider', link)
    ],
  ).toEqual(metadata);
  await act(async () =>
    dialog.root
      .findAllByProps({accessibilityLabel: 'Use provider metadata'})[0]
      .props.onPress(),
  );
  expect(useMetadataOverrideStore.getState().overrides).toEqual({});
  act(() => dialog.unmount());
});

it('opts into provider episode metadata and can disable it without choosing the title again', async () => {
  let dialog!: renderer.ReactTestRenderer;
  await act(async () => {dialog = renderer.create(<ProviderMetadataDialog visible onClose={jest.fn()} info={providerInfo} provider="provider" link={link} />);});
  await act(async () => dialog.root.findAllByProps({accessibilityLabel: 'Edit metadata'})[0].props.onPress());
  expect(dialog.root.findByType('MetadataPicker' as any).props.options.props.value).toBe(false);
  await act(async () => dialog.root.findByType('MetadataPicker' as any).props.options.props.onChange(true));
  await act(async () => dialog.root.findByType('MetadataPicker' as any).props.onChoose(metadata));
  expect(useMetadataOverrideStore.getState().overrides[metadataOverrideKey('provider', link)]).toEqual({...metadata, useEpisodeMetadata: true});
  const saved = JSON.parse(mockStorage.get('provider-metadata-overrides-v1')!);
  expect(saved.state.overrides[metadataOverrideKey('provider', link)].useEpisodeMetadata).toBe(true);
  await act(async () => dialog.root.findAllByProps({accessibilityLabel: 'Edit metadata'})[0].props.onPress());
  expect(dialog.root.findByType('MetadataPicker' as any).props.options.props.value).toBe(true);
  await act(async () => dialog.root.findByType('MetadataPicker' as any).props.options.props.onChange(false));
  expect(useMetadataOverrideStore.getState().overrides[metadataOverrideKey('provider', link)].useEpisodeMetadata).toBe(false);
  expect(useMetadataOverrideStore.getState().overrides[metadataOverrideKey('other', link)]).toBeUndefined();
  act(() => dialog.unmount());
});

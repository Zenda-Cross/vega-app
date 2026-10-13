jest.mock('../src/lib/zustand/metadataOverrideStore', () => ({__esModule: true, default: (selector: any) => selector({overrides: {}}), metadataOverrideKey: (provider: string, link: string) => JSON.stringify([provider, link]), applyMetadataOverride: (info: any) => info}));
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

const mockCache = new Map<string, string>();
const mockGetMetaData = jest.fn();
jest.mock('../src/lib/localContent/files', () => ({listLocalFolder: jest.fn()}));

jest.mock('../src/lib/storage', () => ({
  cacheStorage: {
    getString: (key: string) => mockCache.get(key),
    setString: (key: string, value: string) => mockCache.set(key, value),
  },
}));
jest.mock('../src/lib/services/ProviderManager', () => ({
  providerManager: {getMetaData: (args: object) => mockGetMetaData(args)},
}));
jest.mock('../src/lib/zustand/localContentStore', () => ({__esModule: true, default: (selector: any) => selector({titles: []})}));

jest.mock('axios', () => ({get: jest.fn()}));

import {useContentInfo} from '../src/lib/hooks/useContentInfo';

const link = 'https://example.com/show';
const providerInfo = {
  title: 'Show',
  synopsis: '',
  image: '',
  imdbId: '',
  type: 'series',
  linkList: [{title: 'Season 1', episodesLink: 'https://example.com/s1'}],
};

const renderInfo = async () => {
  const client = new QueryClient({defaultOptions: {queries: {retry: false}}});
  let data: unknown;
  let tree: renderer.ReactTestRenderer | undefined;
  const Probe = () => {
    data = useContentInfo(link, 'vega').data;
    return null;
  };
  await act(async () => {
    tree = renderer.create(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
  });
  await act(async () => {
    // React Query notifies through setTimeout, so wait past it.
    await new Promise(resolve => setTimeout(resolve, 20));
  });
  act(() => tree?.unmount());
  client.clear();
  return data;
};

describe('useContentInfo cache', () => {
  beforeEach(() => {
    mockCache.clear();
    mockGetMetaData.mockReset();
    mockGetMetaData.mockResolvedValue(providerInfo);
  });

  it('fetches from the provider when the cache has no links', async () => {
    mockCache.set(link, JSON.stringify({name: 'Show', videos: []}));
    mockCache.set(
      `contentInfo:vega:${link}`,
      JSON.stringify({name: 'Show', videos: []}),
    );

    const data = await renderInfo();

    expect(mockGetMetaData).toHaveBeenCalledTimes(1);
    expect(data).toEqual(providerInfo);
  });

  it('uses cached info that has links', async () => {
    mockCache.set(`contentInfo:vega:${link}`, JSON.stringify(providerInfo));

    const data = await renderInfo();

    expect(mockGetMetaData).not.toHaveBeenCalled();
    expect(data).toEqual(providerInfo);
  });
});

import React from 'react';
import renderer, {act} from 'react-test-renderer';

const mockCache = new Map<string, string>();
const mockExtract = jest.fn();
import {Platform} from 'react-native';
jest.mock('../src/lib/imageAccent', () => ({
  getCachedImageAccent: (key: string) => mockCache.get(`accent:${key}`),
  extractImageAccent: (...args: unknown[]) => mockExtract(...args),
}));
jest.mock('../src/lib/storage/StorageService', () => ({
  cacheStorage: {
    getString: (key: string) => mockCache.get(key),
    setString: (key: string, value: string) => mockCache.set(key, value),
  },
}));
import {useInfoAccent} from '../src/lib/hooks/useInfoAccent';

const poster = 'https://images.test/poster.jpg';
const background = 'https://images.test/background.jpg';
let props: Parameters<typeof useInfoAccent>[0];
let result: ReturnType<typeof useInfoAccent>;
let tree: renderer.ReactTestRenderer;
const Probe = () => {
  result = useInfoAccent(props);
  return null;
};
const mount = async () =>
  act(async () => {
    tree = renderer.create(<Probe />);
  });
beforeEach(() => {
  Object.defineProperty(Platform, 'OS', {value: 'android', configurable: true});
  jest.useFakeTimers();
  mockCache.clear();
  mockExtract.mockReset();
  props = {poster, pageKey: 'page', enabled: true};
});
afterEach(() => {
  if (tree) act(() => tree.unmount());
  jest.useRealTimers();
});

it('reads the cached poster only, then replaces it with the background accent and remembers the final color', async () => {
  mockExtract.mockResolvedValueOnce('#336699');
  await mount();
  expect(mockExtract).toHaveBeenCalledWith(
    poster,
    `detail-bg-accent-v1:${poster}`,
    {cacheOnly: true},
  );
  expect(result).toEqual({accent: '#336699', ready: true});
  mockExtract.mockResolvedValueOnce('#996633');
  props = {...props, background};
  await act(async () => tree.update(<Probe />));
  expect(result.accent).toBe('#996633');
  expect(mockCache.get('detail-last-accent:page')).toBe('#996633');
});

it('uses the previous background accent immediately on the next visit without extracting the poster', async () => {
  mockCache.set('detail-last-accent:page', '#996633');
  await mount();
  expect(result).toEqual({accent: '#996633', ready: true});
  expect(mockExtract).not.toHaveBeenCalled();
});

it('uses an existing shared poster accent without performing image extraction', async () => {
  mockCache.set(`accent:image:${poster}`, '#336699');
  await mount();
  expect(result).toEqual({accent: '#336699', ready: true});
  expect(mockExtract).not.toHaveBeenCalled();
});

it('limits the poster cache lookup to 200ms and ignores a late poster result', async () => {
  let resolvePoster!: (value: string) => void;
  mockExtract.mockReturnValueOnce(
    new Promise(resolve => {
      resolvePoster = resolve;
    }),
  );
  await mount();
  expect(result.ready).toBe(false);
  await act(async () => jest.advanceTimersByTime(200));
  expect(result.ready).toBe(true);
  mockExtract.mockResolvedValueOnce('#996633');
  props = {...props, background};
  await act(async () => tree.update(<Probe />));
  await act(async () => resolvePoster('#336699'));
  expect(result.accent).toBe('#996633');
});

it('does no extraction and adds no loading wait when dynamic theme is disabled', async () => {
  props = {...props, background, enabled: false};
  await mount();
  expect(result).toEqual({accent: undefined, ready: true});
  expect(mockExtract).not.toHaveBeenCalled();
});

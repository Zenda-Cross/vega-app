const mockStorage = new Map<string, string>();

jest.mock('react-native-mmkv-storage', () => ({
  MMKVLoader: class {
    private instanceId = 'default';
    withInstanceID(instanceId: string) {
      this.instanceId = instanceId;
      return this;
    }
    initialize() {
      return {
        getString: (key: string) => mockStorage.get(key) ?? null,
        setString: (key: string, value: string) => {
          mockStorage.set(key, value);
          return true;
        },
        removeItem: (key: string) => {
          mockStorage.delete(key);
          return true;
        },
        clearStore: () => {
          mockStorage.clear();
        },
      };
    }
  },
}));

import {cache, getColors} from 'react-native-image-colors';
import {extractImageAccent, getCachedImageAccent, clearImageAccentCache} from '../src/lib/imageAccent';

jest.mock('react-native-image-colors', () => ({
  cache: {
    removeItem: jest.fn(),
  },
  getColors: jest.fn(),
}));

const mockGetColors = getColors as jest.MockedFunction<typeof getColors>;
const mockRemoveItem = cache.removeItem as jest.MockedFunction<
  typeof cache.removeItem
>;

describe('extractImageAccent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
    clearImageAccentCache();
  });

  it('evicts fallback results so a later image load can retry', async () => {
    mockGetColors.mockResolvedValue({
      average: '#FFFFFF',
      darkMuted: '#FFFFFF',
      darkVibrant: '#FFFFFF',
      dominant: '#FFFFFF',
      lightMuted: '#FFFFFF',
      lightVibrant: '#FFFFFF',
      muted: '#FFFFFF',
      platform: 'android',
      vibrant: '#FFFFFF',
    });

    await expect(
      extractImageAccent('https://example.test/poster.jpg', 'detail:test'),
    ).resolves.toBeUndefined();
    expect(mockRemoveItem).toHaveBeenCalledWith('detail:test');
  });

  it('returns a valid artwork color, caches it in MMKV, and does not evict it', async () => {
    mockGetColors.mockResolvedValue({
      average: '#334455',
      darkMuted: '#223344',
      darkVibrant: '#112233',
      dominant: '#334455',
      lightMuted: '#778899',
      lightVibrant: '#88AACC',
      muted: '#556677',
      platform: 'android',
      vibrant: '#3366CC',
    });

    await expect(
      extractImageAccent('https://example.test/poster.jpg', 'detail:test'),
    ).resolves.toBe('#3366CC');
    expect(mockRemoveItem).not.toHaveBeenCalled();

    // Verify synchronous MMKV cached retrieval
    expect(getCachedImageAccent('detail:test')).toBe('#3366CC');

    // Calling extractImageAccent again returns cached value without calling getColors
    mockGetColors.mockClear();
    await expect(
      extractImageAccent('https://example.test/poster.jpg', 'detail:test'),
    ).resolves.toBe('#3366CC');
    expect(mockGetColors).not.toHaveBeenCalled();
  });
});


it('reuses a stored accent for the same image across different page cache keys', async () => {
  clearImageAccentCache(); mockStorage.clear(); mockGetColors.mockReset();
  mockGetColors.mockResolvedValue({platform: 'android', vibrant: '#3366CC'} as any);
  await extractImageAccent('https://images.test/poster', 'poster:one', {cacheOnly: true});
  expect(mockGetColors).toHaveBeenCalledWith('https://images.test/poster', expect.objectContaining({cacheOnly: true}));
  mockGetColors.mockClear();
  expect(await extractImageAccent('https://images.test/poster', 'detail:two')).toBe('#3366CC');
  expect(mockGetColors).not.toHaveBeenCalled();
});

it('permits a normal background request after a cache-only lookup misses', async () => {
  clearImageAccentCache(); mockStorage.clear(); mockGetColors.mockReset();
  mockGetColors.mockRejectedValueOnce(new Error('Image cache miss'));
  expect(await extractImageAccent('https://images.test/missing', 'detail:missing', {cacheOnly: true})).toBeUndefined();
  mockGetColors.mockResolvedValueOnce({platform: 'android', vibrant: '#3366CC'} as any);
  expect(await extractImageAccent('https://images.test/missing', 'detail:missing')).toBe('#3366CC');
  expect(mockGetColors).toHaveBeenCalledTimes(2);
  expect(mockGetColors.mock.calls[1][1]?.cacheOnly).toBeUndefined();
});

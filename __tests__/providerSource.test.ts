const mockTokens = new Map<string, string>();

jest.mock('react-native-mmkv-storage', () => ({
  MMKVLoader: class {
    withInstanceID() {
      return this;
    }
    withEncryption() {
      return this;
    }
    initialize() {
      return {
        getString: (key: string) => mockTokens.get(key),
        setString: (key: string, value: string) => mockTokens.set(key, value),
        removeItem: (key: string) => mockTokens.delete(key),
      };
    }
  },
}));

import {
  createProviderSource,
  getProviderFilesUrl,
  isValidProviderPath,
} from '../src/lib/utils/helpers';
import {getSourceAuthHeaders} from '../src/lib/storage/sourceTokenStorage';

const GH = 'https://raw.githubusercontent.com';

const cases: Array<[string, string, string]> = [
  ['foo', 'foo', `${GH}/foo/vega-providers/refs/heads/main`],
  ['@foo', 'foo', `${GH}/foo/vega-providers/refs/heads/main`],
  ['foo@gh', 'foo', `${GH}/foo/vega-providers/refs/heads/main`],
  ['foo@cb', 'foo@cb', 'https://codeberg.org/foo/vega-providers/raw/branch/main'],
  ['foo@BB', 'foo@bb', 'https://bitbucket.org/foo/vega-providers/raw/main'],
  ['foo@gl', 'foo@gl', 'https://gitlab.com/foo/vega-providers/-/raw/main'],
  ['https://github.com/foo/repo/tree/dev', 'foo', `${GH}/foo/repo/refs/heads/dev`],
  [
    `${GH}/foo/repo/refs/heads/main/manifest.json`,
    'foo',
    `${GH}/foo/repo/refs/heads/main`,
  ],
  ['https://codeberg.org/foo/repo', 'foo@cb', 'https://codeberg.org/foo/repo/raw/branch/main'],
  [
    'https://codeberg.org/foo/repo/src/branch/dev',
    'foo@cb',
    'https://codeberg.org/foo/repo/raw/branch/dev',
  ],
  ['https://bitbucket.org/foo/repo/src/dev/', 'foo@bb', 'https://bitbucket.org/foo/repo/raw/dev'],
  ['https://www.bitbucket.org/foo/repo', 'foo@bb', 'https://bitbucket.org/foo/repo/raw/main'],
  ['https://gitlab.com/grp/sub/repo', 'grp/sub@gl', 'https://gitlab.com/grp/sub/repo/-/raw/main'],
  ['https://gitlab.com/foo/repo/-/tree/dev', 'foo@gl', 'https://gitlab.com/foo/repo/-/raw/dev'],
  [
    'https://gitlab.com/foo/repo/-/raw/main/manifest.json',
    'foo@gl',
    'https://gitlab.com/foo/repo/-/raw/main',
  ],
];

describe('createProviderSource', () => {
  it.each(cases)('parses %s', (input, author, url) => {
    expect(createProviderSource(input)).toEqual({author, url, isDefault: false});
  });

  it.each([
    'foo@xx',
    'foo bar',
    'ftp://example.com/manifest.json',
    'https://gitlab.com/foo',
  ])('rejects %s', input => {
    expect(() => createProviderSource(input)).toThrow();
  });

  it.each([
    [
      'http://localhost:3001/manifest.json',
      'localhost:3001',
      'http://localhost:3001',
      'http://localhost:3001/manifest.json',
    ],
    [
      'http://192.168.1.20:3001/',
      '192.168.1.20:3001',
      'http://192.168.1.20:3001',
      'http://192.168.1.20:3001/manifest.json',
    ],
    [
      'http://example.com/manifest.json',
      'example.com',
      'http://example.com',
      'http://example.com/manifest.json',
    ],
    [
      'https://cdn.example.com/vega/manifest.json',
      'cdn.example.com/vega',
      'https://cdn.example.com/vega',
      'https://cdn.example.com/vega/manifest.json',
    ],
    [
      'https://cdn.example.com/vega/',
      'cdn.example.com/vega',
      'https://cdn.example.com/vega',
      'https://cdn.example.com/vega/manifest.json',
    ],
    [
      'https://Example.com:8443/list.json?v=2',
      'example.com:8443',
      'https://example.com:8443',
      'https://example.com:8443/list.json?v=2',
    ],
  ])('parses custom source %s', (input, author, url, manifestUrl) => {
    expect(createProviderSource(input)).toEqual({
      author,
      url,
      manifestUrl,
      isDefault: false,
    });
  });
});

describe('getProviderFilesUrl', () => {
  const base = 'https://cdn.example.com/vega';

  it('uses dist/{value} without a path', () => {
    expect(getProviderFilesUrl(`${base}/`, 'netflix')).toBe(
      `${base}/dist/netflix`,
    );
  });

  it.each(['/providers/netflix', 'providers/netflix/', 'providers//netflix'])(
    'resolves %s under the source folder',
    path => {
      expect(getProviderFilesUrl(base, 'netflix', path)).toBe(
        `${base}/providers/netflix`,
      );
    },
  );

  it.each([
    '../other',
    'a/../../b',
    'a/%2E%2E/b',
    'https://evil.example/x',
    '//evil.example/x',
    'a\\b',
    'a?x=1',
    '/',
  ])('rejects path %s', path => {
    expect(isValidProviderPath(path)).toBe(path === '//evil.example/x');
    if (path !== '//evil.example/x') {
      expect(() => getProviderFilesUrl(base, 'netflix', path)).toThrow();
    }
  });

  it('keeps a protocol-relative looking path inside the source folder', () => {
    expect(getProviderFilesUrl(base, 'netflix', '//evil.example/x')).toBe(
      `${base}/evil.example/x`,
    );
  });
});

describe('getSourceAuthHeaders', () => {
  beforeEach(() => mockTokens.clear());

  it('sends a custom source token only under its own folder', () => {
    mockTokens.set('cdn.example.com/vega', 'secret');
    const author = 'cdn.example.com/vega';

    expect(
      getSourceAuthHeaders(author, 'https://cdn.example.com/vega/p/posts.js'),
    ).toEqual({Authorization: 'token secret'});
    expect(
      getSourceAuthHeaders(author, 'https://cdn.example.com/vegaX/posts.js'),
    ).toEqual({});
    expect(
      getSourceAuthHeaders(author, 'https://cdn.example.com/other/posts.js'),
    ).toEqual({});
    expect(
      getSourceAuthHeaders(author, 'http://cdn.example.com/vega/posts.js'),
    ).toEqual({});
  });

  it('still sends a GitHub token to raw.githubusercontent.com', () => {
    mockTokens.set('foo', 'gh');
    expect(
      getSourceAuthHeaders(
        'foo',
        'https://raw.githubusercontent.com/foo/repo/refs/heads/main/manifest.json',
      ),
    ).toEqual({Authorization: 'token gh'});
    expect(getSourceAuthHeaders('foo', 'https://example.com/x')).toEqual({});
  });
});

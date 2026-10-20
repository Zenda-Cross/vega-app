import {ProviderSource} from '../storage/extensionStorage';

export const formatName = (name: string): string => {
  // Replace special characters with an underscore
  return name.replaceAll(/[^a-zA-Z0-9]/g, '_');
};

export const sanitizeSearchQuery = (text: string): string => {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const DEFAULT_REPO_NAME = 'vega-providers';
const DEFAULT_BRANCH = 'main';
const RAW_GITHUB_HOST = 'raw.githubusercontent.com';
const GITHUB_HOST = 'github.com';
const CODEBERG_HOST = 'codeberg.org';
const BITBUCKET_HOST = 'bitbucket.org';
const GITLAB_HOST = 'gitlab.com';

type SourceHost = 'github' | 'codeberg' | 'bitbucket' | 'gitlab';

// Short suffix for non-GitHub sources: "author@cb". The suffix is also part of
// the stored author key, so the same name on two hosts does not collide.
// GitHub sources keep the plain author name for compatibility.
const HOST_SUFFIXES: Record<string, SourceHost> = {
  gh: 'github',
  cb: 'codeberg',
  bb: 'bitbucket',
  gl: 'gitlab',
};

type ParsedSource = {
  host: SourceHost;
  author: string;
  repo: string;
  branch: string;
};

const buildRawUrl = ({host, author, repo, branch}: ParsedSource): string => {
  switch (host) {
    case 'codeberg':
      return `https://${CODEBERG_HOST}/${author}/${repo}/raw/branch/${branch}`;
    case 'bitbucket':
      return `https://${BITBUCKET_HOST}/${author}/${repo}/raw/${branch}`;
    case 'gitlab':
      return `https://${GITLAB_HOST}/${author}/${repo}/-/raw/${branch}`;
    default:
      return `https://${RAW_GITHUB_HOST}/${author}/${repo}/refs/heads/${branch}`;
  }
};

const buildSourceKey = (host: SourceHost, author: string): string => {
  if (host === 'github') {
    return author;
  }
  const suffix = Object.keys(HOST_SUFFIXES).find(
    key => HOST_SUFFIXES[key] === host,
  );
  return `${author}@${suffix}`;
};

const hostOf = (url: URL): string =>
  url.hostname.toLowerCase().replace(/^www\./, '');

// Path segments without a trailing "manifest.json", so a pasted link to the
// manifest file itself also works.
const getPathSegments = (url: URL): string[] => {
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments[segments.length - 1] === 'manifest.json') {
    segments.pop();
  }
  return segments;
};

const joinBranch = (segments: string[]): string =>
  segments.length > 0
    ? decodeURIComponent(segments.join('/'))
    : DEFAULT_BRANCH;

const parseRawGithubUrl = (url: URL): ParsedSource | null => {
  if (hostOf(url) !== RAW_GITHUB_HOST) {
    return null;
  }

  const segments = getPathSegments(url);
  if (segments.length < 4) {
    return null;
  }

  const author = segments[0];
  const repo = segments[1];
  let branch = DEFAULT_BRANCH;

  if (
    segments[2] === 'refs' &&
    segments[3] === 'heads' &&
    segments.length > 4
  ) {
    branch = joinBranch(segments.slice(4));
  }

  if (!author || !repo) {
    return null;
  }

  return {host: 'github', author, repo, branch};
};

const parseGithubRepoUrl = (url: URL): ParsedSource | null => {
  if (hostOf(url) !== GITHUB_HOST) {
    return null;
  }

  const segments = getPathSegments(url);
  if (segments.length < 2) {
    return null;
  }

  const author = segments[0];
  const repo = segments[1];
  let branch = DEFAULT_BRANCH;

  if (segments[2] === 'tree' && segments.length > 3) {
    branch = joinBranch(segments.slice(3));
  }

  if (!author || !repo) {
    return null;
  }

  return {host: 'github', author, repo, branch};
};

// codeberg.org/{owner}/{repo}[/src|raw/branch/{branch}]
const parseCodebergUrl = (url: URL): ParsedSource | null => {
  if (hostOf(url) !== CODEBERG_HOST) {
    return null;
  }

  const segments = getPathSegments(url);
  if (segments.length < 2) {
    return null;
  }

  const [author, repo, view, kind] = segments;
  let branch = DEFAULT_BRANCH;

  if (
    (view === 'src' || view === 'raw') &&
    kind === 'branch' &&
    segments.length > 4
  ) {
    branch = joinBranch(segments.slice(4));
  }

  return {host: 'codeberg', author, repo, branch};
};

// bitbucket.org/{workspace}/{repo}[/src|raw/{branch}]
const parseBitbucketUrl = (url: URL): ParsedSource | null => {
  if (hostOf(url) !== BITBUCKET_HOST) {
    return null;
  }

  const segments = getPathSegments(url);
  if (segments.length < 2) {
    return null;
  }

  const [author, repo, view] = segments;
  let branch = DEFAULT_BRANCH;

  if ((view === 'src' || view === 'raw') && segments.length > 3) {
    branch = joinBranch(segments.slice(3));
  }

  return {host: 'bitbucket', author, repo, branch};
};

// gitlab.com/{group}[/{subgroup}...]/{repo}[/-/tree|raw|blob/{branch}].
// The namespace may hold subgroups, so the repo is the segment before "-".
const parseGitlabUrl = (url: URL): ParsedSource | null => {
  if (hostOf(url) !== GITLAB_HOST) {
    return null;
  }

  const segments = getPathSegments(url);
  const separator = segments.indexOf('-');
  const projectPath = separator >= 0 ? segments.slice(0, separator) : segments;
  if (projectPath.length < 2) {
    return null;
  }

  const repo = projectPath[projectPath.length - 1];
  const author = projectPath.slice(0, -1).join('/');
  let branch = DEFAULT_BRANCH;

  const view = segments[separator + 1];
  if (
    separator >= 0 &&
    (view === 'tree' || view === 'raw' || view === 'blob') &&
    segments.length > separator + 2
  ) {
    branch = joinBranch(segments.slice(separator + 2));
  }

  return {host: 'gitlab', author, repo, branch};
};

// A malformed link to a known host is an error, not a custom source.
const KNOWN_HOSTS = [
  RAW_GITHUB_HOST,
  GITHUB_HOST,
  CODEBERG_HOST,
  BITBUCKET_HOST,
  GITLAB_HOST,
];

const URL_PARSERS = [
  parseRawGithubUrl,
  parseGithubRepoUrl,
  parseCodebergUrl,
  parseBitbucketUrl,
  parseGitlabUrl,
];

const toProviderSource = (parsed: ParsedSource): ProviderSource => ({
  author: buildSourceKey(parsed.host, parsed.author),
  url: buildRawUrl(parsed),
  isDefault: false,
});

/**
 * Any other HTTP or HTTPS URL: a manifest file (path ending in .json) or the folder
 * holding manifest.json. Provider files are resolved against that folder. The
 * author key is the host and folder path, so two sites never share provider
 * data, cookies or tokens.
 */
const toCustomProviderSource = (url: URL): ProviderSource => {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Custom provider sources must use http or https');
  }
  const segments = url.pathname.split('/').filter(Boolean);
  const manifestFile =
    segments.length > 0 && /\.json$/i.test(segments[segments.length - 1])
      ? segments.pop()!
      : 'manifest.json';
  const folder = segments.length > 0 ? `/${segments.join('/')}` : '';
  const base = `${url.origin}${folder}`;
  return {
    author: `${url.host.toLowerCase()}${folder}`,
    url: base,
    manifestUrl: `${base}/${manifestFile}${url.search}`,
    isDefault: false,
  };
};

/**
 * True for a manifest `path` that stays inside the source folder: relative
 * segments only, no "." or "..", no query or backslash.
 */
export const isValidProviderPath = (path: unknown): path is string => {
  // "%2e%2e" is read as ".." by URL parsers, so encoded dots are refused too.
  if (typeof path !== 'string' || /[\\?#]|%2e/i.test(path)) {
    return false;
  }
  const segments = path.split('/').filter(Boolean);
  return (
    segments.length > 0 &&
    !/^[a-z][a-z0-9+.-]*:/i.test(path) &&
    segments.every(segment => segment !== '.' && segment !== '..')
  );
};

/**
 * Folder holding a provider's files: the manifest `path` under the source
 * folder ("/providers/netflix" and "providers/netflix" mean the same), or
 * dist/{value} when the manifest gives none.
 */
export const getProviderFilesUrl = (
  sourceUrl: string,
  providerValue: string,
  path?: string,
): string => {
  const base = sourceUrl.replace(/\/+$/, '');
  if (path === undefined || path === '') {
    return `${base}/dist/${providerValue}`;
  }
  if (!isValidProviderPath(path)) {
    throw new Error(`Invalid provider path: ${path}`);
  }
  return `${base}/${path.split('/').filter(Boolean).join('/')}`;
};

/**
 * Accepts a repo or raw URL on GitHub, Codeberg, Bitbucket or GitLab, any
 * other HTTP or HTTPS manifest URL, or a short name: "author" (GitHub), "author@cb"
 * (Codeberg), "author@bb" (Bitbucket) or "author@gl" (GitLab). Short names use
 * the default vega-providers repo on the main branch.
 */
export const createProviderSource = (value: string): ProviderSource => {
  const input = value.trim();
  if (!input) {
    throw new Error('Provider source value is required');
  }

  const isUrlInput = /^https?:\/\//i.test(input);

  if (isUrlInput) {
    let parsed: URL;
    try {
      parsed = new URL(input);
    } catch {
      throw new Error('Invalid provider source URL');
    }

    for (const parse of URL_PARSERS) {
      const source = parse(parsed);
      if (source) {
        return toProviderSource(source);
      }
    }
    if (KNOWN_HOSTS.includes(hostOf(parsed))) {
      throw new Error('Unsupported URL for this host');
    }
    return toCustomProviderSource(parsed);
  }

  const match = /^@?([^\s@/]+)(?:@([a-z]+))?$/i.exec(input);
  const host = match && HOST_SUFFIXES[(match[2] || 'gh').toLowerCase()];
  if (!match || !host) {
    throw new Error('Invalid provider source name');
  }

  return toProviderSource({
    host,
    author: match[1],
    repo: DEFAULT_REPO_NAME,
    branch: DEFAULT_BRANCH,
  });
};

import {beforeEach, describe, expect, it, jest} from '@jest/globals';

const mockFiles = new Map<string, number>();
const mockDirectories = new Set<string>();
const mockSafFiles = new Map<string, number>();
const mockSafDirectories = new Set<string>();

const getSafChildren = (parent: string) =>
  [
    ...[...mockSafDirectories].filter(uri => uri.startsWith(`${parent}/`)),
    ...[...mockSafFiles.keys()].filter(uri => uri.startsWith(`${parent}/`)),
  ].filter(uri => !uri.slice(parent.length + 1).includes('/'));

jest.mock('@dr.pogodin/react-native-fs', () => ({
  CachesDirectoryPath: '/cache',
  ExternalDirectoryPath: '/app-files',
  exists: async (path: string) =>
    mockFiles.has(path) || mockDirectories.has(path),
  mkdir: async (path: string) => mockDirectories.add(path),
  unlink: async (path: string) => {
    mockFiles.delete(path);
    mockDirectories.delete(path);
    for (const key of [...mockFiles.keys()]) {
      if (key.startsWith(`${path}/`)) {
        mockFiles.delete(key);
      }
    }
  },
  stat: async (path: string) => ({size: mockFiles.get(path) ?? 0}),
  readDir: async (path: string) => [...mockFiles.keys()].filter(key => key.startsWith(`${path}/`)),
  moveFile: async (from: string, to: string) => {
    const size = mockFiles.get(from) ?? 0;
    mockFiles.delete(from);
    mockFiles.set(to, size);
  },
}));

jest.mock('expo-file-system/legacy', () => ({
  StorageAccessFramework: {
    readDirectoryAsync: jest.fn(async (directory: string) =>
      getSafChildren(directory),
    ),
    makeDirectoryAsync: async (parent: string, name: string) => {
      const uri = `${parent}/${name}`;
      mockSafDirectories.add(uri);
      return uri;
    },
    createFileAsync: async (directory: string, name: string) => {
      const uri = `${directory}/${name}`;
      mockSafFiles.set(uri, 0);
      return uri;
    },
    deleteAsync: async (uri: string) => {
      mockSafFiles.delete(uri);
      mockSafDirectories.delete(uri);
    },
  },
  getInfoAsync: jest.fn(async (uri: string) => ({
    exists: mockSafFiles.has(uri),
    size: mockSafFiles.get(uri),
  })),
}));

jest.mock('react-native', () => ({
  Platform: {OS: 'android', isTV: false},
  NativeModules: {
    SafCopyModule: {
      copyFileToUri: async (from: string, uri: string) => {
        mockSafFiles.set(uri, mockFiles.get(from) ?? 0);
      },
      getUriSize: async (uri: string) => mockSafFiles.get(uri) ?? -1,
    },
  },
}));

import {
  deleteDownloadOutput,
  downloadOutputExists,
  finalizeDownloadOutput,
  getDownloadStagingDirectory,
  prepareDownloadDestination,
  isDownloadDestinationEmpty,
  discardDownloadDestination,
} from '../src/lib/downloadDestination';
import * as FileSystem from 'expo-file-system/legacy';
import {Platform} from 'react-native';
import {getTVDefaultDownloadLocation} from '../src/lib/downloadLocation';

describe('download destination service', () => {
  it('discards staging files and the SAF output before switching servers', async () => {
    const id = 'fallback';
    const root = getDownloadStagingDirectory(id);
    mockDirectories.add(root);
    mockFiles.set(`${root}/partial`, 99);
    mockSafFiles.set('content://old-output', 99);
    await discardDownloadDestination(id, {
      stagingDirectory: root, stagingPath: 'content://old-output', directFinalDocumentUri: 'content://old-output',
    });
    expect(mockFiles.has(`${root}/partial`)).toBe(false);
    expect(mockSafFiles.has('content://old-output')).toBe(false);
  });

  it('rejects a server switch if the SAF provider silently ignores deletion', async () => {
    mockSafFiles.set('content://old-output', 99);
    const remove = jest.spyOn(FileSystem.StorageAccessFramework, 'deleteAsync').mockResolvedValueOnce(undefined);
    try {
      await expect(discardDownloadDestination('fallback', {
        stagingDirectory: '', stagingPath: 'content://old-output', directFinalDocumentUri: 'content://old-output',
      })).rejects.toThrow('Unable to clear');
    } finally {
      remove.mockRestore();
    }
  });

  it('allows missing or empty files but refuses unreported bytes', async () => {
    const destination = {stagingDirectory: '/cache/refresh', stagingPath: '/cache/refresh/file.part'};
    await expect(isDownloadDestinationEmpty(destination)).resolves.toBe(true);
    mockFiles.set(destination.stagingPath, 0);
    await expect(isDownloadDestinationEmpty(destination)).resolves.toBe(true);
    mockFiles.set(destination.stagingPath, 64);
    await expect(isDownloadDestinationEmpty(destination)).resolves.toBe(false);
  });

  it('checks bytes written to a direct SAF destination', async () => {
    const direct = {stagingDirectory: '', stagingPath: 'content://refresh/file', directFinalDocumentUri: 'content://refresh/file'};
    mockSafFiles.set(direct.directFinalDocumentUri, 0);
    await expect(isDownloadDestinationEmpty(direct)).resolves.toBe(true);
    mockSafFiles.set(direct.directFinalDocumentUri, 128);
    await expect(isDownloadDestinationEmpty(direct)).resolves.toBe(false);
  });

  it('refuses HLS segments before the final output has been created', async () => {
    const destination = {stagingDirectory: '/cache/refresh', stagingPath: '/cache/refresh/file.part'};
    mockDirectories.add('/cache/refresh/segments');
    mockFiles.set('/cache/refresh/segments/1.ts', 32);
    await expect(isDownloadDestinationEmpty(destination)).resolves.toBe(false);
  });

  it('fails closed when destination metadata cannot be read', async () => {
    const info = jest.spyOn(FileSystem, 'getInfoAsync').mockRejectedValueOnce(new Error('Permission denied'));
    await expect(isDownloadDestinationEmpty({stagingDirectory: '', stagingPath: 'content://unreadable'})).resolves.toBe(false);
    info.mockRestore();
  });

  beforeEach(() => {
    (Platform as any).isTV = false;
    mockFiles.clear();
    mockDirectories.clear();
    mockSafFiles.clear();
    mockSafDirectories.clear();
  });

  it('preserves HLS staging segments when preparing a resumed download', async () => {
    const options = {downloadId: 'hls-resume', location: {type: 'saf' as const, uri: 'content://downloads/tree', label: 'Downloads'},
      fileName: 'episode', fileType: 'mp4'};
    const first = await prepareDownloadDestination(options);
    const segment = `${first.stagingDirectory}/segments/video_0.ts`;
    mockFiles.set(segment, 1024);
    const resumed = await prepareDownloadDestination({...options, preserveStaging: true});
    expect(resumed.stagingDirectory).toBe(first.stagingDirectory);
    expect(mockFiles.get(segment)).toBe(1024);
    await prepareDownloadDestination(options);
    expect(mockFiles.has(segment)).toBe(false);
  });

  it('creates an isolated staging directory for each download ID', async () => {
    const first = await prepareDownloadDestination({
      downloadId: 'Show_SSeason 1_E1',
      location: {
        type: 'saf',
        uri: 'content://downloads/tree',
        label: 'Downloads',
      },
      fileName: 'episode_one',
      fileType: 'mp4',
    });
    const second = await prepareDownloadDestination({
      downloadId: 'Show_SSeason 1_E2',
      location: {
        type: 'saf',
        uri: 'content://downloads/tree',
        label: 'Downloads',
      },
      fileName: 'episode_two',
      fileType: 'mp4',
    });

    expect(first.stagingDirectory).not.toBe(second.stagingDirectory);
    expect(first.stagingPath).toContain('Show_SSeason 1_E1');
  });

  it('keeps staging directories apart for long and similar download IDs', async () => {
    const season =
      'Season 1 (2022) Dual Audio {Hindi-English} 480p [150MB] || 720p [400MB] || 1080p [1.2GB] WEB-DL x264 ESubs';
    const show =
      'A Very Long Show Title That Keeps Going For A While (2022) Complete Series';
    const ids = [
      `${show}_S${season}_E1`,
      `${show}_S${season}_E2`,
      'Show:Part_direct_0',
      'Show?Part_direct_0',
    ];
    const directories = ids.map(getDownloadStagingDirectory);

    expect(new Set(directories).size).toBe(ids.length);
    for (const directory of directories) {
      expect(directory.length).toBeLessThan(140);
    }

    const location = {
      type: 'saf' as const,
      uri: 'content://downloads/tree',
      label: 'Downloads',
    };
    const first = await prepareDownloadDestination({
      downloadId: ids[0],
      location,
      fileName: 'episode_one',
      fileType: 'mp4',
    });
    mockFiles.set(first.stagingPath, 1024);
    await prepareDownloadDestination({
      downloadId: ids[1],
      location,
      fileName: 'episode_two',
      fileType: 'mp4',
    });

    expect(mockFiles.get(first.stagingPath)).toBe(1024);
  });

  it('creates an HTTP target directly inside the selected SAF hierarchy', async () => {
    const destination = await prepareDownloadDestination({
      downloadId: 'direct-http',
      location: {
        type: 'saf',
        uri: 'content://downloads/tree',
        label: 'Downloads',
      },
      fileName: 'Episode_1',
      fileType: 'mkv',
      directToSaf: true,
      outputDirectoryNames: ['show', 'season_1'],
    });

    expect(destination).toEqual({
      stagingDirectory: '',
      stagingPath: 'content://downloads/tree/show/season_1/Episode_1.mkv',
      directFinalDocumentUri:
        'content://downloads/tree/show/season_1/Episode_1.mkv',
    });
    expect(mockDirectories.size).toBe(0);
  });

  it('reuses a partial SAF document when resuming', async () => {
    const partialUri = 'content://downloads/tree/show/movie.mp4';
    mockSafFiles.set(partialUri, 4096);

    const destination = await prepareDownloadDestination({
      downloadId: 'direct-http',
      location: {
        type: 'saf',
        uri: 'content://downloads/tree',
        label: 'Downloads',
      },
      fileName: 'movie',
      fileType: 'mp4',
      directToSaf: true,
      existingFinalDocumentUri: partialUri,
    });

    expect(destination.directFinalDocumentUri).toBe(partialUri);
    expect(mockSafFiles.get(partialUri)).toBe(4096);
  });

  it('rejects a path destination', async () => {
    const stagingPath = '/cache/downloads/movie/movie.mp4.part';
    mockDirectories.add('/cache/downloads/movie');
    mockDirectories.add('/downloads');
    mockFiles.set(stagingPath, 1024);

    await expect(
      finalizeDownloadOutput({
        downloadId: 'movie',
        location: {type: 'path', path: '/downloads'},
        stagingPath,
        fileName: 'movie',
        fileType: 'mp4',
      }),
    ).rejects.toThrow('SAF download location is required');
  });

  it('moves a TV download into Vega app storage', async () => {
    (Platform as any).isTV = true;
    expect(getTVDefaultDownloadLocation().path).toBe('/app-files/Vega Downloads');
    const stagingDirectory = getDownloadStagingDirectory('movie');
    const stagingPath = `${stagingDirectory}/movie.mp4.part`;
    mockDirectories.add(stagingDirectory);
    mockFiles.set(stagingPath, 2048);

    const output = await finalizeDownloadOutput({
      downloadId: 'movie',
      location: {
        type: 'path',
        path: '/app-files/Vega Downloads',
        label: 'Vega app storage',
      },
      stagingPath,
      fileName: 'movie',
      fileType: 'mp4',
      outputDirectoryNames: ['Example Show', 'Season 1'],
    });

    expect(output).toEqual({
      filePath: '/app-files/Vega Downloads/Example Show/Season 1/movie.mp4',
      size: 2048,
    });
    expect(mockFiles.has(stagingPath)).toBe(false);
    expect(mockDirectories.has(stagingDirectory)).toBe(false);
  });

  it('copies and verifies a SAF destination', async () => {
    const downloadId = 'movie';
    const stagingDirectory = getDownloadStagingDirectory(downloadId);
    const stagingPath = `${stagingDirectory}/movie.mp4.part`;
    mockDirectories.add(stagingDirectory);
    mockFiles.set(stagingPath, 2048);

    const output = await finalizeDownloadOutput({
      downloadId,
      location: {
        type: 'saf',
        uri: 'content://downloads/tree',
        label: 'Downloads',
      },
      stagingPath,
      fileName: 'movie',
      fileType: 'mp4',
    });

    expect(output).toEqual({
      filePath: 'content://downloads/tree/movie.mp4',
      finalDocumentUri: 'content://downloads/tree/movie.mp4',
      size: 2048,
    });
  });

  it('writes series into show and season subfolders', async () => {
    const stagingPath = '/cache/downloads/show/episode.mp4.part';
    mockFiles.set(stagingPath, 2048);

    const output = await finalizeDownloadOutput({
      downloadId: 'show-season-episode',
      location: {
        type: 'saf',
        uri: 'content://downloads/tree',
        label: 'Downloads',
      },
      stagingPath,
      fileName: 'Episode_1',
      fileType: 'mp4',
      outputDirectoryNames: ['show', 'season_1'],
    });

    expect(output.filePath).toBe(
      'content://downloads/tree/show/season_1/Episode_1.mp4',
    );
  });

  it('removes empty season and show directories after deletion', async () => {
    const showUri = 'content://downloads/tree/show';
    const seasonUri = `${showUri}/season_1`;
    const fileUri = `${seasonUri}/Episode_1.mp4`;
    mockSafDirectories.add(showUri);
    mockSafDirectories.add(seasonUri);
    mockSafFiles.set(fileUri, 100);

    await deleteDownloadOutput(fileUri, {
      downloadLocation: {
        type: 'saf',
        uri: 'content://downloads/tree',
        label: 'Downloads',
      },
      outputDirectoryNames: ['show', 'season_1'],
    });

    expect(mockSafFiles.has(fileUri)).toBe(false);
    expect(mockSafDirectories.has(seasonUri)).toBe(false);
    expect(mockSafDirectories.has(showUri)).toBe(false);
  });

  it('succeeds when the SAF file was already deleted manually', async () => {
    const showUri = 'content://downloads/tree/show';
    const seasonUri = `${showUri}/season_1`;
    const fileUri = `${seasonUri}/Episode_1.mp4`;
    mockSafDirectories.add(showUri);
    mockSafDirectories.add(seasonUri);

    await expect(
      deleteDownloadOutput(fileUri, {
        downloadLocation: {
          type: 'saf',
          uri: 'content://downloads/tree',
          label: 'Downloads',
        },
        outputDirectoryNames: ['show', 'season_1'],
      }),
    ).resolves.toBe(true);

    expect(mockSafDirectories.has(seasonUri)).toBe(false);
    expect(mockSafDirectories.has(showUri)).toBe(false);
  });

  it('falls back to metadata when native size fails for an existing document', async () => {
    const native = require('react-native').NativeModules.SafCopyModule;
    const spy = jest.spyOn(native, 'getUriSize').mockRejectedValueOnce(new Error('Size unavailable'));
    (FileSystem.getInfoAsync as jest.Mock).mockResolvedValueOnce({exists: true});
    await expect(downloadOutputExists('content://downloads/present.mp4')).resolves.toBe(true);
    spy.mockRestore();
  });

  it('does not turn two failed access checks into a missing result', async () => {
    const native = require('react-native').NativeModules.SafCopyModule;
    const spy = jest.spyOn(native, 'getUriSize').mockRejectedValueOnce(new Error('Permission denied'));
    (FileSystem.getInfoAsync as jest.Mock).mockRejectedValueOnce(new Error('Permission denied'));
    await expect(downloadOutputExists('content://downloads/present.mp4')).rejects.toThrow('Permission denied');
    spy.mockRestore();
  });

  it('allows deletion but preserves uncertainty when stale SAF metadata cannot be read', async () => {
    const fileUri = 'content://downloads/missing.mp4';
    const getInfoAsync = FileSystem.getInfoAsync as jest.Mock;
    getInfoAsync.mockRejectedValueOnce(new Error('Document no longer exists'));

    await expect(deleteDownloadOutput(fileUri)).resolves.toBe(true);
    await expect(downloadOutputExists(fileUri)).rejects.toThrow('Document no longer exists');
  });

  it('succeeds when the deleted file parent tree is inaccessible', async () => {
    const fileUri = 'content://downloads/tree/show/Episode_1.mp4';
    const readDirectoryAsync = FileSystem.StorageAccessFramework
      .readDirectoryAsync as jest.Mock;
    readDirectoryAsync.mockRejectedValueOnce(new Error('Tree unavailable'));

    await expect(
      deleteDownloadOutput(fileUri, {
        downloadLocation: {
          type: 'saf',
          uri: 'content://downloads/tree',
          label: 'Downloads',
        },
        outputDirectoryNames: ['show'],
      }),
    ).resolves.toBe(true);
  });

  it('succeeds when the local file was already deleted manually', async () => {
    await expect(deleteDownloadOutput('/downloads/missing.mp4')).resolves.toBe(
      true,
    );
  });

  it('keeps non-empty season and show directories after deletion', async () => {
    const showUri = 'content://downloads/tree/show';
    const seasonUri = `${showUri}/season_1`;
    const fileUri = `${seasonUri}/Episode_1.mp4`;
    mockSafDirectories.add(showUri);
    mockSafDirectories.add(seasonUri);
    mockSafFiles.set(fileUri, 100);
    mockSafFiles.set(`${seasonUri}/Episode_2.mp4`, 100);

    await deleteDownloadOutput(fileUri, {
      downloadLocation: {
        type: 'saf',
        uri: 'content://downloads/tree',
        label: 'Downloads',
      },
      outputDirectoryNames: ['show', 'season_1'],
    });

    expect(mockSafDirectories.has(seasonUri)).toBe(true);
    expect(mockSafDirectories.has(showUri)).toBe(true);
  });

  it('removes an empty season but keeps a show containing another season', async () => {
    const showUri = 'content://downloads/tree/show';
    const seasonOneUri = `${showUri}/season_1`;
    const seasonTwoUri = `${showUri}/season_2`;
    const fileUri = `${seasonOneUri}/Episode_1.mp4`;
    mockSafDirectories.add(showUri);
    mockSafDirectories.add(seasonOneUri);
    mockSafDirectories.add(seasonTwoUri);
    mockSafFiles.set(fileUri, 100);
    mockSafFiles.set(`${seasonTwoUri}/Episode_1.mp4`, 100);

    await deleteDownloadOutput(fileUri, {
      downloadLocation: {
        type: 'saf',
        uri: 'content://downloads/tree',
        label: 'Downloads',
      },
      outputDirectoryNames: ['show', 'season_1'],
    });

    expect(mockSafDirectories.has(seasonOneUri)).toBe(false);
    expect(mockSafDirectories.has(showUri)).toBe(true);
    expect(mockSafDirectories.has(seasonTwoUri)).toBe(true);
  });

  it('rejects empty staging files', async () => {
    const stagingPath = '/cache/downloads/movie/movie.mp4.part';
    mockFiles.set(stagingPath, 0);

    await expect(
      finalizeDownloadOutput({
        downloadId: 'movie',
        location: {
          type: 'saf',
          uri: 'content://downloads/tree',
          label: 'Downloads',
        },
        stagingPath,
        fileName: 'movie',
        fileType: 'mp4',
      }),
    ).rejects.toThrow('Downloaded staging file is empty');
  });
});

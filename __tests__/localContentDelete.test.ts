import * as RNFS from '@dr.pogodin/react-native-fs';
import * as FileSystem from 'expo-file-system/legacy';
import {deleteLocalEpisodes} from '../src/lib/localContent/delete';
import useLocalContentStore from '../src/lib/zustand/localContentStore';

jest.mock('@dr.pogodin/react-native-fs', () => ({
  exists: jest.fn(async () => true),
  unlink: jest.fn(async () => undefined),
}));
jest.mock('expo-file-system/legacy', () => ({
  StorageAccessFramework: {deleteAsync: jest.fn(async () => undefined)},
}));
jest.mock('../src/lib/storage/StorageService', () => ({
  createZustandStorage: () => ({
    getItem: () => null,
    setItem: jest.fn(),
    removeItem: jest.fn(),
  }),
}));
const title = (id: string, uris: string[]) => ({
  id,
  name: id,
  rootUri: 'root',
  folderUri: id,
  useMetadataTitles: true,
  episodes: uris.map(uri => ({uri, name: uri, folder: 'Default'})),
});
beforeEach(() => {
  jest.clearAllMocks();
  useLocalContentStore.setState({
    titles: [
      title('show', ['content://one', 'content://two']),
      title('other', ['file:///other.mkv']),
    ],
  });
});

it('deletes one SAF document and preserves the other episodes and titles', async () => {
  await deleteLocalEpisodes(['content://one']);
  expect(FileSystem.StorageAccessFramework.deleteAsync).toHaveBeenCalledWith(
    'content://one',
  );
  expect(
    useLocalContentStore
      .getState()
      .titles.find(t => t.id === 'show')
      ?.episodes.map(e => e.uri),
  ).toEqual(['content://two']);
  expect(
    useLocalContentStore.getState().titles.find(t => t.id === 'other'),
  ).toBeDefined();
});
it('bulk deletes indexed videos once and removes titles only after their last file', async () => {
  await deleteLocalEpisodes([
    'content://one',
    'content://one',
    'content://two',
    'file:///other.mkv',
    'content://not-indexed',
  ]);
  expect(FileSystem.StorageAccessFramework.deleteAsync).toHaveBeenCalledTimes(
    2,
  );
  expect(RNFS.unlink).toHaveBeenCalledWith('/other.mkv');
  expect(useLocalContentStore.getState().titles).toEqual([]);
});
it('keeps failed files indexed while committing successful deletions', async () => {
  (
    FileSystem.StorageAccessFramework.deleteAsync as jest.Mock
  ).mockRejectedValueOnce(new Error('Permission denied'));
  await expect(
    deleteLocalEpisodes(['content://one', 'content://two']),
  ).rejects.toThrow('Could not delete 1');
  expect(
    useLocalContentStore
      .getState()
      .titles.find(t => t.id === 'show')
      ?.episodes.map(e => e.uri),
  ).toEqual(['content://one']);
});
it('removes a successfully deleted file from overlapping imports too', async () => {
  useLocalContentStore
    .getState()
    .saveTitles([title('overlap', ['content://one'])]);
  await deleteLocalEpisodes(['content://one']);
  expect(
    useLocalContentStore.getState().titles.some(t => t.id === 'overlap'),
  ).toBe(false);
  expect(
    useLocalContentStore
      .getState()
      .titles.flatMap(t => t.episodes)
      .some(e => e.uri === 'content://one'),
  ).toBe(false);
});

it('keeps a local file indexed if filesystem deletion fails', async () => {
  (RNFS.unlink as jest.Mock).mockRejectedValueOnce(new Error('Read only'));
  await expect(deleteLocalEpisodes(['file:///other.mkv'])).rejects.toThrow(
    'Could not delete 1',
  );
  expect(
    useLocalContentStore.getState().titles.find(t => t.id === 'other')
      ?.episodes,
  ).toHaveLength(1);
});
it('cleans an indexed local video that was already removed outside the app', async () => {
  (RNFS.exists as jest.Mock).mockResolvedValueOnce(false);
  await deleteLocalEpisodes(['file:///other.mkv']);
  expect(RNFS.unlink).not.toHaveBeenCalled();
  expect(
    useLocalContentStore.getState().titles.some(t => t.id === 'other'),
  ).toBe(false);
});

import * as RNFS from '@dr.pogodin/react-native-fs';
import * as FileSystem from 'expo-file-system/legacy';
import useLocalContentStore from '../zustand/localContentStore';

// Delete only indexed video documents, never recursively remove an import folder.
export async function deleteLocalEpisodes(uris: string[]): Promise<void> {
  const failed: string[] = [];
  for (const uri of new Set(uris)) {
    const store = useLocalContentStore.getState();
    if (
      !store.titles.some(title =>
        title.episodes.some(episode => episode.uri === uri),
      )
    )
      continue;
    try {
      if (uri.startsWith('content://')) {
        await FileSystem.StorageAccessFramework.deleteAsync(uri);
      } else {
        const path = uri.startsWith('file://')
          ? decodeURIComponent(uri.slice(7))
          : uri;
        if (await RNFS.exists(path)) await RNFS.unlink(path);
      }
      // Read current state after IO so concurrent edits and successful deletions survive.
      const current = useLocalContentStore.getState();
      for (const title of current.titles) {
        if (!title.episodes.some(episode => episode.uri === uri)) continue;
        const episodes = title.episodes.filter(episode => episode.uri !== uri);
        if (episodes.length) current.saveTitles([{...title, episodes}]);
        else current.removeTitle(title.id);
      }
    } catch {
      failed.push(uri);
    }
  }
  if (failed.length)
    throw new Error(
      `Could not delete ${failed.length} video file(s). Check folder access and try again. Files that could not be deleted remain listed.`,
    );
}

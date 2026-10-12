import {NativeModules, Platform} from 'react-native';
import * as RNFS from '@dr.pogodin/react-native-fs';
import * as FileSystem from 'expo-file-system/legacy';
import {getAndroidDirectoryLabel} from '../downloadLocation';
import {takePersistableUriPermission} from '../uriPermission';
import type {LocalEntry} from './model';

export async function pickLocalFolder(): Promise<
  {uri: string; name: string} | undefined
> {
  if (Platform.OS === 'android') {
    const result =
      await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
    if (!result.granted) return;
    if (!(await takePersistableUriPermission(result.directoryUri))) {
      throw new Error(
        'This folder cannot keep access after restarting. Please select another folder.',
      );
    }
    return {
      uri: result.directoryUri,
      name:
        getAndroidDirectoryLabel(result.directoryUri).split('/').pop() ||
        'Local content',
    };
  }
  const folders = await RNFS.pickFile({pickerType: 'folder'});
  if (folders[0])
    return {
      uri: folders[0],
      name: folders[0].split('/').pop() || 'Local content',
    };
}

export async function listLocalFolder(uri: string): Promise<LocalEntry[]> {
  if (uri.startsWith('content://')) {
    const module = NativeModules.UriPermissionModule;
    if (!module?.listDirectory)
      throw new Error('Folder imports require the updated Android build.');
    return module.listDirectory(uri);
  }
  return (await RNFS.readDir(uri.replace(/^file:\/\//, ''))).map(entry => ({
    uri: `file://${entry.path}`,
    name: entry.name,
    directory: entry.isDirectory(),
  }));
}

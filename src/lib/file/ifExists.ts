import RNFS from 'react-native-fs';
import {downloadFolder} from '../constants';

// check if file exists in download folder folder

export const ifExists = async (fileName: string) => {
  try {
    const files = await RNFS.readDir(downloadFolder);

    // Find a file with the given name (without extension)
    const file = files.find(file => {
      const nameWithoutExtension = file.name.split('.').slice(0, -1).join('.');
      return nameWithoutExtension === fileName;
    });

    if (file) {
      return file.path;
    } else {
      return false;
    }
  } catch (error) {
    console.log('Error reading directory:', error);
    return false;
  }
};

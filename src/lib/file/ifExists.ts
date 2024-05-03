import RNFS from 'react-native-fs';

// check if file exists in download folder/vega folder

export const ifExists = async (fileName: string) => {
  const downloadDest = `${RNFS.DownloadDirectoryPath}/vega/${fileName}`;
  const exists = await RNFS.exists(downloadDest);
  if (exists) {
    return `${RNFS.DownloadDirectoryPath}/vega/${fileName}`;
  } else {
    return false;
  }
};

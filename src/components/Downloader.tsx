import React, {useLayoutEffect, useState} from 'react';
import {View, Button, Text, TouchableOpacity, Alert, Modal} from 'react-native';
import RNFS from 'react-native-fs';
import {ifExists} from '../lib/file/ifExists';
import {
  download,
  completeHandler,
  checkForExistingDownloads,
} from '@kesha-antonov/react-native-background-downloader';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {getStream} from '../lib/getStream';

const DownloadComponent = ({
  link,
  fileName,
  type,
}: {
  link: string;
  fileName: string;
  type: string;
}) => {
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);
  const [alreadyDownloaded, setAlreadyDownloaded] = useState<string | boolean>(
    false,
  );
  const [deleteModal, setDeleteModal] = useState(false);

  useLayoutEffect(() => {
    const checkIfDownloaded = async () => {
      const exists = await ifExists(fileName);
      setAlreadyDownloaded(exists);

      // check if download is already in progress
      const tasks = await checkForExistingDownloads();
      console.log('Tasks:', tasks);
      const task = tasks.find(task => task.id === 'fileId');
      if (task) {
        setIsDownloading(true);
      }
    };
    checkIfDownloaded();
  }, []);

  const downloadFile = async () => {
    setIsDownloading(true);
    setDownloadError(null); // Reset error

    if (await ifExists(fileName)) {
      console.log('File already exists');
      setIsDownloading(false);
      return;
    }
    // try {
    //   // downloadFile and save it to download folder
    //   if (!(await RNFS.exists(`${RNFS.DownloadDirectoryPath}/vega`))) {
    //     await RNFS.mkdir(`${RNFS.DownloadDirectoryPath}/vega`);
    //   }
    //   const downloadDest = `${RNFS.DownloadDirectoryPath}/vega/${fileName}`;
    //   const ret = RNFS.downloadFile({
    //     fromUrl: url,
    //     progressInterval: 1000,
    //     backgroundTimeout: 1000 * 60 * 60,
    //     progressDivider: 1,
    //     toFile: downloadDest,
    //     background: true,
    //     begin: (res: any) => {
    //       console.log('Download has started', res);
    //     },
    //     progress: (res: any) => {
    //       const progress = res.bytesWritten / res.contentLength;
    //       setDownloadProgress(progress * 100);
    //       console.log('Download progress:', progress * 100);
    //     },
    //   });
    //   ret.promise.then(res => {
    //     console.log('Download complete', res);
    //     setIsDownloading(false);
    //   });
    // } catch (error: any) {
    //   console.error('Download error:', error);
    //   setDownloadError(error.message);
    //   setIsDownloading(false);
    // }

    const jobId = 'fileId';
    const url = await getStream(link, type);

    let task = download({
      id: jobId,
      url: url[0],
      destination: `${RNFS.DownloadDirectoryPath}/vega/${fileName}`,
      metadata: {},
      isNotificationVisible: true,
    })
      .begin(({expectedBytes}) => {
        console.log(`Going to download ${expectedBytes} bytes!`);
      })
      .progress(({bytesDownloaded, bytesTotal}) => {
        console.log(`Downloaded: ${(bytesDownloaded / bytesTotal) * 100}%`);
      })
      .done(({bytesDownloaded, bytesTotal}) => {
        console.log('Download is done!', {bytesDownloaded, bytesTotal});

        completeHandler(jobId);
        setIsDownloading(false);
        setAlreadyDownloaded(true);
      })
      .error(({error, errorCode}) => {
        console.log('Download canceled due to error: ', {error, errorCode});
        Alert.alert('Download Error', error);
        setIsDownloading(false);
        task.stop();
      });

    return () => {
      task.stop();
    };
  };

  // handle download deletion
  const deleteDownload = async () => {
    try {
      await RNFS.unlink(`${RNFS.DownloadDirectoryPath}/vega/${fileName}`);
      setAlreadyDownloaded(false);
      setDeleteModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View className="flex-row items-center mt-1 justify-between rounded-full bg-tertiary p-2">
      {alreadyDownloaded ? (
        <TouchableOpacity onPress={() => setDeleteModal(true)}>
          <MaterialIcons name="file-download-done" size={24} color="white" />
        </TouchableOpacity>
      ) : isDownloading ? (
        <TouchableOpacity onPress={() => console.log('Cancel download')}>
          <MaterialIcons name="downloading" size={24} color="tomato" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={downloadFile}>
          <MaterialIcons name="file-download" size={24} color="white" />
        </TouchableOpacity>
      )}
      {deleteModal && (
        <Modal animationType="fade" visible={deleteModal} transparent={true}>
          <View className="flex-1 bg-black/50 justify-center items-center p-4">
            <View className="bg-quaternary p-3 w-96 rounded-md justify-center items-center">
              <Text className="text-lg font-semibold my-3">
                Are you sure you want to delete this file?
              </Text>
              <Text className="text-sm">{fileName}</Text>
              <View className="flex-row items-center justify-evenly w-full my-5">
                <Button
                  color={'tomato'}
                  title="Yes"
                  onPress={() => deleteDownload()}
                />
                <Button
                  color={'tomato'}
                  title="No"
                  onPress={() => setDeleteModal(false)}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default DownloadComponent;

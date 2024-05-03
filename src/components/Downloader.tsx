import React, {useLayoutEffect, useState} from 'react';
import {View, Button, Text, TouchableOpacity} from 'react-native';
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
  const [alreadyDownloaded, setAlreadyDownloaded] = useState(false);

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
        setIsDownloading(false);
        task.stop();
      });

    return () => {
      task.stop();
    };
  };

  return (
    <View className="flex-row items-center mt-1 justify-between rounded-full bg-tertiary p-2">
      {alreadyDownloaded ? (
        <TouchableOpacity>
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
    </View>
  );
};

export default DownloadComponent;

import {ifExists} from './file/ifExists';
import {hlsDownloader} from './hlsDownloader';
import RNFS from 'react-native-fs';
import notifee from '@notifee/react-native';
import {Alert} from 'react-native';
import {Downloads} from './zustand/downloadsStore';

export const downloadManager = async ({
  title,
  url,
  fileName,
  fileType,
  downloadStore,
  setAlreadyDownloaded,
}: {
  title: string;
  url: string;
  fileName: string;
  fileType: string;
  downloadStore: Downloads;
  setAlreadyDownloaded: (value: boolean) => void;
}) => {
  const {addActiveDownload, removeActiveDownload, activeDownloads} =
    downloadStore;
  const channelId = await notifee.createChannel({
    id: 'download',
    name: 'Download Notifications',
  });
  if (await ifExists(fileName)) {
    console.log('File already exists');
    setAlreadyDownloaded(true);
    removeActiveDownload(fileName);
    return;
  }
  addActiveDownload({title, url, fileName, fileType});
  // if (activeDownloads.length > 0) {
  //   notifee.displayNotification({
  //     id: 'downloadQueue',
  //     title: 'Download Queue' + fileName,
  //     body: 'Downloading ' + fileName,
  //     android: {
  //       channelId,
  //       color: '#FF6347',
  //     },
  //   });
  //   console.log(
  //     'Downloading:',
  //     activeDownloads[0],
  //     activeDownloads[1],
  //     activeDownloads.length,
  //   );

  //   return;
  // }
  try {
    // downloadFile and save it to download folder
    if (!(await RNFS.exists(`${RNFS.DownloadDirectoryPath}/vega`))) {
      await RNFS.mkdir(`${RNFS.DownloadDirectoryPath}/vega`);
    }
    await notifee.requestPermission();

    if (fileType === 'm3u8') {
      hlsDownloader({
        videoUrl: url,
        downloadStore,
        path: `${RNFS.DownloadDirectoryPath}/vega/${fileName}.mp4`,
        fileName,
        title,
        setAlreadyDownloaded,
      });
      console.log('Downloading HLS');
      return;
    }
    const downloadDest = `${RNFS.DownloadDirectoryPath}/vega/${fileName}.${fileType}`;
    const ret = RNFS.downloadFile({
      fromUrl: url,
      progressInterval: 1000,
      backgroundTimeout: 1000 * 60 * 60,
      progressDivider: 1,
      toFile: downloadDest,
      background: true,
      begin: (res: any) => {
        console.log('Download has started', res);
      },
      progress: (res: any) => {
        const progress = res.bytesWritten / res.contentLength;
        const body =
          res.contentLength < 1024 * 1024 * 1024
            ? // less than 1GB?

              Math.round(res.bytesWritten / 1024 / 1024) +
              ' / ' +
              Math.round(res.contentLength / 1024 / 1024) +
              ' MB'
            : parseFloat((res.bytesWritten / 1024 / 1024 / 1024).toFixed(2)) +
              ' / ' +
              parseFloat((res.contentLength / 1024 / 1024 / 1024).toFixed(2)) +
              ' GB';
        // console.log('Download progress:', progress * 100);
        notifee.displayNotification({
          id: fileName,
          title: title,
          data: {jobId: ret.jobId, fileName},
          body: body,
          android: {
            smallIcon: 'ic_notification',
            channelId,
            color: '#FF6347',
            onlyAlertOnce: true,
            progress: {
              max: 100,
              current: progress * 100,
              indeterminate: false,
            },
            pressAction: {
              id: 'default',
            },
            actions: [
              {
                title: 'Cancel',
                pressAction: {
                  id: fileName,
                },
              },
            ],
          },
        });
      },
    });
    ret.promise.then(res => {
      console.log('Download complete', res);
      setAlreadyDownloaded(true);
      notifee.cancelNotification(fileName);
      notifee.displayNotification({
        id: 'downloadComplete' + fileName,
        title: 'Download complete',
        body: title,
        android: {
          smallIcon: 'ic_notification',
          channelId,
          color: '#FF6347',
        },
      });
      removeActiveDownload(fileName);
      // downloadManager({
      //   ...activeDownloads[0],
      //   downloadStore,
      //   setAlreadyDownloaded,
      // });
    });
    ret.promise.catch(err => {
      console.log('Download error:', err);
      Alert.alert('Download failed', err.message || 'Failed to download');
      notifee.cancelNotification(fileName);
      notifee.displayNotification({
        id: 'downloadFailed' + fileName,
        title: 'Download failed',
        body: title,
        android: {
          smallIcon: 'ic_notification',
          channelId,
          color: '#FF6347',
        },
      });
      removeActiveDownload(fileName);
      setAlreadyDownloaded(false);
      notifee.cancelNotification(fileName);
      console.log('Retrying download', activeDownloads[0]);
      // downloadManager({
      //   ...activeDownloads[0],
      //   downloadStore,
      //   setAlreadyDownloaded,
      // });
    });
  } catch (error: any) {
    console.error('Download error:', error);
    Alert.alert('Download failed', 'Failed to download');
    removeActiveDownload(fileName);
    setAlreadyDownloaded(false);
  }
};

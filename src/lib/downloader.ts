import {ifExists} from './file/ifExists';
// import {hlsDownloader} from './hlsDownloader';
import * as RNFS from '@dr.pogodin/react-native-fs';
import {Alert} from 'react-native';
import {downloadFolder} from './constants';
import requestStoragePermission from './file/getStoragePermission';
import {hlsDownloader2} from './hlsDownloader2';
import {notificationService} from './services/Notification';

export const downloadManager = async ({
  title,
  url,
  fileName,
  fileType,
  setDownloadActive,
  setAlreadyDownloaded,
  setDownloadId,
  headers,
  deleteDownload,
}: {
  title: string;
  url: string;
  fileName: string;
  fileType: string;
  setDownloadActive: (value: boolean) => void;
  headers?: any;
  setAlreadyDownloaded: (value: boolean) => void;
  setDownloadId: (value: number) => void;
  deleteDownload: () => void;
}) => {
  await requestStoragePermission();

  await notificationService.showDownloadStarting(title, fileName);
  if (await ifExists(fileName)) {
    console.log('File already exists');
    setAlreadyDownloaded(true);
    setDownloadActive(false);
    return;
  }
  setDownloadActive(true);
  // if (activeDownloads.length > 0) {
  //   notifee.displayNotification({
  //     id: 'downloadQueue',
  //     title: 'Download Queue' + fileName,
  //     body: 'Downloading ' + fileName,
  //     android: {
  //       channelId,
  //       color: primary,
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
    if (!(await RNFS.exists(downloadFolder))) {
      await RNFS.mkdir(downloadFolder);
    }
    await notificationService.requestPermission();

    if (fileType === 'm3u8') {
      // hlsDownloader({
      //   videoUrl: url,
      //   downloadStore,
      //   path: `${downloadFolder}/${fileName}.mp4`,
      //   fileName,
      //   title,
      //   setAlreadyDownloaded,
      //   setDownloadId: setDownloadId,
      //   headers,
      // });
      hlsDownloader2({
        videoUrl: url,
        setDownloadActive,
        path: `${downloadFolder}/${fileName}.mp4`,
        fileName,
        title,
        setAlreadyDownloaded,
        setDownloadId: setDownloadId,
        headers,
      });
      // ToastAndroid.show(
      //   'Hls video download is not supported, Use external Downloader',
      //   ToastAndroid.LONG,
      // );
      // notifee.cancelNotification(fileName);
      // downloadStore.removeActiveDownload(fileName);
      // setAlreadyDownloaded(false);
      console.log('Downloading HLS');
      return;
    }
    const downloadDest = `${downloadFolder}/${fileName}.${fileType}`;
    const ret = RNFS.downloadFile({
      fromUrl: url,
      progressInterval: 1000,
      backgroundTimeout: 1000 * 60 * 60,
      progressDivider: 1,
      headers: headers ? headers : {},
      toFile: downloadDest,
      background: true,
      begin: (res: any) => {
        console.log('Download has started', res);
        setDownloadId(ret.jobId);
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
        notificationService.showDownloadProgress(
          title,
          fileName,
          progress,
          body,
          ret.jobId,
        );
      },
    });
    ret.promise.then(res => {
      console.log('Download complete', res);
      setAlreadyDownloaded(true);
      notificationService.showDownloadComplete(title, fileName);
      setDownloadActive(false);
      // downloadManager({
      //   ...activeDownloads[0],
      //   downloadStore,
      //   setAlreadyDownloaded,
      // });
    });
    ret.promise.catch(err => {
      deleteDownload();
      console.log('Download error:', err);
      Alert.alert('Download failed', err.message || 'Failed to download');
      notificationService.showDownloadFailed(title, fileName);
      setDownloadActive(false);
      setAlreadyDownloaded(false);
      // downloadManager({
      //   ...activeDownloads[0],
      //   downloadStore,
      //   setAlreadyDownloaded,
      // });
    });
    return ret.jobId;
  } catch (error: any) {
    console.error('Download error:', error);
    deleteDownload();
    Alert.alert('Download failed', 'Failed to download');
    setDownloadActive(false);
    setAlreadyDownloaded(false);
  }
};

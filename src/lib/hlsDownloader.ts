import {FFmpegKit, FFprobeKit, ReturnCode} from 'ffmpeg-kit-react-native';
import notifee from '@notifee/react-native';
import {Downloads} from './zustand/downloadsStore';
import {settingsStorage} from './storage';

const getVideoDuration = async (videoUrl: string) => {
  try {
    const information = await FFprobeKit.getMediaInformation(videoUrl);
    const output = await information.getOutput();
    const jsonOutput = JSON.parse(output);
    console.log('Output: 🔥🔥🔥', jsonOutput.format.duration);
    const duration = parseFloat(jsonOutput.format.duration);
    return duration;
  } catch (error) {
    console.log('Error getting video duration', error);
    return 0;
  }
};

export const hlsDownloader = async ({
  videoUrl,
  path,
  fileName,
  title,
  downloadStore,
  setAlreadyDownloaded,
  setDownloadId,
  headers = {},
}: {
  videoUrl: string;
  path: string;
  fileName: string;
  title: string;
  downloadStore: Downloads;
  setAlreadyDownloaded: (value: boolean) => void;
  setDownloadId: (value: number) => void;
  headers?: any;
}) => {
  const ffprobeHttpHeaders = headers
    ? Object.entries(headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\r\n') + '\r\n'
    : '';
  const command = `-headers "${ffprobeHttpHeaders}" -i ${videoUrl} -c copy -bsf:a aac_adtstoasc -f mp4 -reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5 -timeout 5000000 -preset ultrafast ${path}`;
  const channelId = await notifee.createChannel({
    id: 'download',
    name: 'Download Notifications',
  });
  const primary = settingsStorage.getPrimaryColor();
  try {
    const duration = (await getVideoDuration(videoUrl)) || 0;
    await FFmpegKit.executeAsync(
      command,
      async session => {
        console.log(
          'FFmpeg process started with sessionId: ' + session.getSessionId(),
        );

        const returnCode = await session.getReturnCode();

        if (ReturnCode.isSuccess(returnCode)) {
          // If download was successful, move the downloaded file into the devices library
          console.log('Download successful');
          setAlreadyDownloaded(true);
          downloadStore.removeActiveDownload(fileName);
          await notifee.cancelNotification(fileName);
          await notifee.displayNotification({
            title: 'Download completed',
            body: `Downloaded ${title}`,
            android: {
              pressAction: {
                id: 'default',
              },
              color: primary,
              smallIcon: 'ic_notification',
              channelId,
            },
          });
        } else {
          setAlreadyDownloaded(false);
          downloadStore.removeActiveDownload(fileName);
          console.log('Download failed');
          await notifee.cancelNotification(fileName);
          await notifee.displayNotification({
            title: 'Download failed',
            body: `Failed to download ${title}`,
            android: {
              pressAction: {
                id: 'default',
              },
              color: primary,
              smallIcon: 'ic_notification',
              channelId,
            },
          });
        }
      },
      async log => {
        const message = log.getMessage();
        const regex = /time=(\d{2}:\d{2}:\d{2}.\d{2})/;
        const currentTime = regex.exec(message as string);
        if (currentTime && currentTime[1]) {
          const currentTimeInSeconds =
            parseInt(currentTime[1].split(':')[0]) * 3600 +
            parseInt(currentTime[1].split(':')[1]) * 60 +
            parseFloat(currentTime[1].split(':')[2]);
          const progress = (currentTimeInSeconds / duration) * 100;
          console.log('Progress: ', currentTimeInSeconds, duration, progress);
          setDownloadId(log.getSessionId());
          await notifee.displayNotification({
            title: title,
            body:
              progress > 100
                ? 'Downloading'
                : `Downloaded ${progress.toFixed(2)}%`,
            id: fileName,
            data: {fileName, jobId: log.getSessionId()},
            android: {
              pressAction: {
                id: 'default',
              },
              smallIcon: 'ic_notification',
              onlyAlertOnce: true,
              progress: {
                max: 100,
                indeterminate: progress > 100,
                current: progress > 100 ? 100 : progress,
              },
              color: primary,
              channelId,
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
        }
      },
    );
  } catch (error) {
    setAlreadyDownloaded(false);
    downloadStore.removeActiveDownload(fileName);
    console.log('Error downloading', error);
    await notifee.displayNotification({
      title: 'Download failed',
      body: `Failed to download ${fileName}`,
      android: {
        pressAction: {
          id: 'default',
        },
        color: primary,
        smallIcon: 'ic_notification',
        channelId,
      },
    });
  }
};

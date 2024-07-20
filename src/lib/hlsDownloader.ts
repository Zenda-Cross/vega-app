import {FFmpegKit, ReturnCode} from 'ffmpeg-kit-react-native';
import notifee from '@notifee/react-native';

let duration: number = 0;

const getVideoDuration = async (videoUrl: string) => {
  const command = `-i ${videoUrl}`;
  await FFmpegKit.executeAsync(command, async session => {
    const output = await session.getOutput();
    const durationMatch: any = output.match(
      /Duration: (\d{2}):(\d{2}):(\d{2}\.\d+)/,
    );
    duration =
      (Number(durationMatch?.[1]) || 0) * 3600 +
      (Number(durationMatch?.[2]) || 0) * 60 +
      (Number(durationMatch?.[3]) || 0);
    console.log('🔥🔥🔥duration:🔥🔥🔥 ', duration, durationMatch);
  });
  console.log('🔥🔥🔥duration:🔥🔥🔥 ', duration);
  return duration;
};

export const hlsDownloader = async (videoUrl: string, outputFile: string) => {
  const command = `-i ${videoUrl} -c copy -bsf:a aac_adtstoasc -f mp4 ${outputFile}`;
  await getVideoDuration(videoUrl);
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
        await notifee.displayNotification({
          title: 'Download completed',
          body: 'Download completed successfully',
          android: {
            channelId: 'download',
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
        console.log('Progress: ', progress);
        const channelId = await notifee.createChannel({
          id: 'download',
          name: 'Download Notifications',
        });
        await notifee.displayNotification({
          title: 'Download in progress',
          body: `Downloaded ${progress.toFixed(2)}%`,
          id: log.getSessionId().toString(),
          android: {
            onlyAlertOnce: true,
            progress: {
              max: 100,
              current: progress,
            },
            channelId,
          },
        });
      }
    },
  );
};

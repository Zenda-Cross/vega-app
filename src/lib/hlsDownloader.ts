import {FFmpegKit, ReturnCode} from 'ffmpeg-kit-react-native';

export const hlsDownloader = async (videoUrl: string, outputFile: string) => {
  const command = `-i ${videoUrl} -c copy -bsf:a aac_adtstoasc -f mp4 -preset fast ${outputFile}`;

  await FFmpegKit.executeAsync(command, async session => {
    console.log(
      'FFmpeg process started with sessionId: ' + session.getSessionId(),
    );
    const returnCode = await session.getReturnCode();

    if (ReturnCode.isSuccess(returnCode)) {
      // If download was successful, move the downloaded file into the devices library
      console.log('Download successful');
    }
  });
};

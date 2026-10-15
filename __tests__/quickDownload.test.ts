jest.mock('../src/lib/downloader', () => ({
  downloadManager: jest.fn().mockResolvedValue(undefined),
}));
import {downloadManager} from '../src/lib/downloader';
import {queueQuickDownload} from '../src/lib/quickDownload';

const request = {
  downloadId: 'episode1',
  title: 'Show Episode 1',
  fileName: 'show_episode1',
  mediaType: 'series' as const,
  sourceLink: 'https://provider/episode1',
  deleteDownload: () => {},
};
beforeEach(() => jest.clearAllMocks());

it('queues video with headers and the first subtitle as a separate download', async () => {
  await queueQuickDownload(request, {
    server: 'First',
    type: 'm3u8',
    quality: '1080',
    link: 'https://cdn/video',
    headers: {Referer: 'https://provider'},
    subtitles: [
      {
        uri: 'https://cdn/en.vtt',
        title: 'English',
        language: 'en',
        type: 'text/vtt',
      },
      {uri: 'https://cdn/fr.vtt', title: 'French', type: 'text/vtt'},
    ],
  } as any);
  expect(downloadManager).toHaveBeenCalledTimes(2);
  expect(downloadManager).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({
      downloadId: 'episode1',
      url: 'https://cdn/video',
      fileType: 'm3u8',
      quality: '1080',
      headers: {Referer: 'https://provider'},
    }),
  );
  expect(downloadManager).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      downloadId: 'episode1_subtitle_English',
      url: 'https://cdn/en.vtt',
      fileType: 'vtt',
      isSubtitle: true,
    }),
  );
});

it('does not enqueue after cancellation', async () => {
  const controller = new AbortController();
  controller.abort();
  await queueQuickDownload(
    request,
    {link: 'https://cdn/video', type: 'mp4', server: 'First'},
    controller.signal,
  );
  expect(downloadManager).not.toHaveBeenCalled();
});

import {canTryNextDownloadServer, getNextDownloadServer, isBelowOnePercent} from '../src/lib/downloadServerFallback';
import {DownloadPauseSupportError} from '../src/lib/downloadBackends/types';
import type {DownloadItem} from '../src/lib/zustand/downloadsStore';

const record = {
  server: 'A', url: 'https://a/video', sourceLink: 'https://provider/episode',
  provider: 'provider', sourceType: 'http', videoType: 'mkv', quality: '1080',
  downloadedBytes: 0, totalBytes: 0,
} as DownloadItem;

it.each([
  [0, 0, true], [99, 10000, true], [100, 10000, false], [101, 10000, false],
  [1, 0, false], [-1, 100, false], [NaN, 100, false], [1, Infinity, false],
])('checks the strict threshold for %s / %s', (downloadedBytes, totalBytes, expected) => {
  expect(isBelowOnePercent({...record, downloadedBytes, totalBytes})).toBe(expected);
});

it.each(['ENOSPC', 'No space left on device', 'Permission denied', 'EACCES', 'Unable to open destination', 'Download cancelled'])(
  'does not switch hosts for %s', message => {
    expect(canTryNextDownloadServer(record, new Error(message))).toBe(false);
  },
);

it('allows server errors but excludes torrents, subtitles and pause failures', () => {
  expect(canTryNextDownloadServer(record, new Error('HTTP 500'))).toBe(true);
  expect(canTryNextDownloadServer({...record, sourceType: 'torrent'}, new Error('HTTP 500'))).toBe(false);
  expect(canTryNextDownloadServer({...record, isSubtitle: true}, new Error('HTTP 500'))).toBe(false);
  expect(canTryNextDownloadServer(record, new DownloadPauseSupportError())).toBe(false);
});

it('keeps quality/format and skips already attempted servers and URLs', () => {
  const stream = (server: string, link: string, quality = '1080', type = 'mkv') => ({server, link, quality, type});
  expect(getNextDownloadServer([
    stream('A', 'fresh-a'), stream('B', 'wrong-quality', '480'),
    stream('C', 'wrong-format', '1080', 'mp4'), stream('D', record.url),
    stream('E', 'ambiguous-1'), stream('E', 'ambiguous-2'), stream('F', 'right'),
  ], record, new Set(['a']), new Set([record.url]))?.link).toBe('right');
});

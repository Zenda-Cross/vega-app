import {NativeModules} from 'react-native';
import {remoteDeliveryService as service} from '../src/lib/remote/remoteDeliveryService';

jest.mock('react-native', () => ({
  Platform: {OS: 'android'}, DeviceEventEmitter: {},
  NativeModules: {VegaRemoteDelivery: {
    inspectMediaTracks: jest.fn(), stopServer: jest.fn(async () => {}),
  }},
}));
jest.mock('../src/lib/remote/mkvParser', () => ({fetchAndParseMkvHeader: jest.fn()}));
const inspect = NativeModules.VegaRemoteDelivery.inspectMediaTracks as jest.Mock;
const info = {hasVideo: true, durationSeconds: 300, audioTracks: [], subtitleTracks: []};
beforeEach(async () => {await service.stopServer(); inspect.mockReset().mockResolvedValue(info);});

it('shares concurrent inspections and reuses metadata for the same source/headers', async () => {
  await Promise.all([service.inspectTracks('https://video/a.mp4'), service.inspectTracks('https://video/a.mp4')]);
  await service.inspectTracks('https://video/a.mp4');
  expect(inspect).toHaveBeenCalledTimes(1);
});
it('does not share results across authentication headers or local file reads', async () => {
  await service.inspectTracks('https://video/a.mp4', false, {Authorization: 'one'});
  await service.inspectTracks('https://video/a.mp4', false, {Authorization: 'two'});
  await service.inspectTracks('file:///a.mp4', true);
  await service.inspectTracks('file:///a.mp4', true);
  expect(inspect).toHaveBeenCalledTimes(4);
});
it('retries failed inspections and clears successful metadata on stop', async () => {
  inspect.mockRejectedValueOnce(new Error('timeout'));
  await service.inspectTracks('https://video/a.mp4');
  await service.inspectTracks('https://video/a.mp4');
  expect(inspect).toHaveBeenCalledTimes(2);
  await service.stopServer();
  await service.inspectTracks('https://video/a.mp4');
  expect(inspect).toHaveBeenCalledTimes(3);
});

it('does not repopulate HLS metadata after a stopped in-flight inspection finishes', async () => {
  const originalFetch = global.fetch;
  let finish!: (value: unknown) => void;
  const response = {ok: true, url: 'https://video/master.m3u8', text: async () =>
    '#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000000,RESOLUTION=1280x720\nv1.m3u8\n'};
  const fetchMock = jest.fn().mockImplementationOnce(() => new Promise(resolve => {finish = resolve;}))
    .mockResolvedValue(response);
  global.fetch = fetchMock;
  try {
    const old = service.inspectTracks('https://video/master.m3u8');
    await service.stopServer();
    finish(response);
    await old;
    await service.inspectTracks('https://video/master.m3u8');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  } finally {global.fetch = originalFetch;}
});

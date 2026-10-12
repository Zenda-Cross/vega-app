const mockSetEnabled = jest.fn(async () => undefined);
const mockGetInitialVideo = jest.fn();
const mockRemove = jest.fn();
let mockListener: (value: unknown) => void;

jest.mock('react-native', () => ({
  Platform: {OS: 'android'},
  NativeModules: {
    VegaVideoIntent: {
      setEnabled: (...args: unknown[]) => mockSetEnabled(...args),
      getInitialVideo: () => mockGetInitialVideo(),
    },
  },
  NativeEventEmitter: jest.fn(() => ({
    addListener: (_: string, listener: typeof mockListener) => {
      mockListener = listener;
      return {remove: mockRemove};
    },
  })),
}));

import {
  externalVideoStream,
  getInitialVideoIntent,
  parseVideoIntent,
  setVideoIntentsEnabled,
  subscribeVideoIntent,
  videoIntentPlayerParams,
} from '../src/lib/services/videoIntent';
const {addVideoPlayerAlias} = require('../plugins/video-player-intents');

beforeEach(() => jest.clearAllMocks());

it('accepts granted content URIs and keeps their encoded path intact', () => {
  expect(parseVideoIntent({uri: 'content://files/a%2Fb.mkv'})).toEqual({
    uri: 'content://files/a%2Fb.mkv',
    title: 'Video',
    mimeType: '',
  });
  for (const uri of [
    'data:text/html,bad',
    'intent://video',
    '/private/video',
    '',
  ]) {
    expect(parseVideoIntent({uri})).toBeNull();
  }
  expect(parseVideoIntent(null)).toBeNull();
});

it('opens signed remote URLs without changing their query or importing a Library item', () => {
  const uri = 'https://cdn.test/videoplayback?sig=a%2Bb&expire=123';
  const params = videoIntentPlayerParams({
    uri,
    title: 'Shared video',
    mimeType: 'video/mp4',
  });
  expect(params.directUrl).toBe(uri);
  expect(params.episodeList[0].link).toBe(uri);
  expect(params.localContent).toBe(true);
  expect(params.infoUrl).toBeUndefined();
  expect(externalVideoStream(params)).toEqual({
    server: 'Opened video',
    link: uri,
    type: '',
  });
});

it('recognizes HLS and DASH while allowing automatic detection for ordinary files', () => {
  for (const [uri, mimeType, type] of [
    ['https://cdn.test/manifest', 'application/vnd.apple.mpegurl', 'm3u8'],
    ['https://cdn.test/index.m3u8?sig=123', '', 'm3u8'],
    ['https://cdn.test/manifest.mpd', '', 'mpd'],
    ['content://files/video.mkv', 'video/x-matroska', ''],
  ]) {
    expect(
      externalVideoStream({directUrl: uri, externalVideo: {mimeType}})?.type,
    ).toBe(type);
  }
  expect(
    externalVideoStream({directUrl: 'https://provider.test/episode'}),
  ).toBeUndefined();
});

it('passes Settings changes to Android and surfaces failure instead of claiming the toggle succeeded', async () => {
  await setVideoIntentsEnabled(false);
  expect(mockSetEnabled).toHaveBeenCalledWith(false);
  mockSetEnabled.mockRejectedValueOnce(new Error('Package manager failed'));
  await expect(setVideoIntentsEnabled(true)).rejects.toThrow(
    'Package manager failed',
  );
});

it('handles cold and warm launches and removes its event listener', async () => {
  const payload = {
    uri: 'file:///video.mp4',
    title: 'Video',
    mimeType: 'video/mp4',
  };
  mockGetInitialVideo.mockResolvedValue(payload);
  expect(await getInitialVideoIntent()).toEqual(payload);
  const listener = jest.fn();
  const unsubscribe = subscribeVideoIntent(listener);
  mockListener(payload);
  mockListener({uri: 'data:text/html,bad'});
  expect(listener).toHaveBeenCalledTimes(1);
  expect(listener).toHaveBeenCalledWith(payload);
  unsubscribe();
  expect(mockRemove).toHaveBeenCalledTimes(1);
});

it('adds a separately switchable video alias without replacing launcher aliases or claiming general web links', () => {
  const launcher = {$: {'android:name': '.LauncherDefault'}};
  const application = {'activity-alias': [launcher]};
  addVideoPlayerAlias(application);
  addVideoPlayerAlias(application);
  expect(application['activity-alias']).toHaveLength(2);
  expect(application['activity-alias'][0]).toBe(launcher);
  const alias: any = application['activity-alias'][1];
  expect(alias.$['android:targetActivity']).toBe('.MainActivity');
  expect(alias.$['android:enabled']).toBe('true');
  const view = alias['intent-filter'][0];
  expect(
    view.data.some((item: any) => item.$['android:mimeType'] === 'video/*'),
  ).toBe(true);
  expect(
    view.data.some((item: any) => item.$['android:mimeType'] === '*/*'),
  ).toBe(false);
});

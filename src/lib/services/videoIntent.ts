import {NativeEventEmitter, NativeModules, Platform} from 'react-native';
import type {RootStackParamList} from '../../App';
import type {Stream} from '../providers/types';

export interface VideoIntentPayload {
  uri: string;
  title: string;
  mimeType: string;
}

const native = NativeModules.VegaVideoIntent;
export const supportsVideoIntents =
  Platform.OS === 'android' && Boolean(native);

export const parseVideoIntent = (value: unknown): VideoIntentPayload | null => {
  if (!value || typeof value !== 'object') return null;
  const payload = value as Partial<VideoIntentPayload>;
  if (
    typeof payload.uri !== 'string' ||
    !/^(content|file|https?):\/\//i.test(payload.uri)
  )
    return null;
  return {
    uri: payload.uri,
    title:
      typeof payload.title === 'string' && payload.title.trim()
        ? payload.title
        : 'Video',
    mimeType: typeof payload.mimeType === 'string' ? payload.mimeType : '',
  };
};

export const setVideoIntentsEnabled = async (
  enabled: boolean,
): Promise<void> => {
  if (!supportsVideoIntents)
    throw new Error(
      'Opening videos from other apps requires an updated Android app.',
    );
  await native.setEnabled(enabled);
};

export const getInitialVideoIntent =
  async (): Promise<VideoIntentPayload | null> => {
    if (!supportsVideoIntents) return null;
    return parseVideoIntent(await native.getInitialVideo());
  };

export const subscribeVideoIntent = (
  listener: (payload: VideoIntentPayload) => void,
): (() => void) => {
  if (!supportsVideoIntents) return () => {};
  const subscription = new NativeEventEmitter(native).addListener(
    'onVegaOpenVideo',
    value => {
      const payload = parseVideoIntent(value);
      if (payload) listener(payload);
    },
  );
  return () => subscription.remove();
};

export const videoIntentPlayerParams = (
  payload: VideoIntentPayload,
): RootStackParamList['Player'] => ({
  linkIndex: 0,
  episodeList: [{id: payload.uri, link: payload.uri, title: payload.title}],
  directUrl: payload.uri,
  externalVideo: {mimeType: payload.mimeType},
  localContent: true,
  type: 'movie',
  primaryTitle: payload.title,
  poster: {},
  providerValue: 'local',
});

export const externalVideoStream = (params: {
  directUrl?: string;
  externalVideo?: {mimeType: string};
}): Stream | undefined => {
  if (!params.externalVideo || !params.directUrl) return undefined;
  const mime = params.externalVideo.mimeType.toLowerCase();
  const type =
    mime.includes('mpegurl') || /\.m3u8(?:[?#]|$)/i.test(params.directUrl)
      ? 'm3u8'
      : mime.includes('dash') || /\.mpd(?:[?#]|$)/i.test(params.directUrl)
        ? 'mpd'
        : '';
  return {server: 'Opened video', link: params.directUrl, type};
};

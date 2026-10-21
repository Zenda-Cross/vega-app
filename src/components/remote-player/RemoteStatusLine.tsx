import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import AppText from '../ui/Text';
import Button from '../ui/Button';
import {useRemoteStore} from '../../lib/remote/remoteStore';
import {useM3Colors} from '../../theme/M3PaletteContext';

interface RemoteStatusLineProps {
  skipIntervals?: {from: number; to: number; title?: string}[];
  onSkipPress?: (seconds: number) => void;
  preparingText?: string | null;
  /** Small second line, such as torrent download progress. */
  detailText?: string | null;
}

/**
 * Reserve space for status/actions and their detail line. Native buttons and
 * larger system fonts must never overflow into the media title or seekbar.
 */
export const RemoteStatusLine: React.FC<RemoteStatusLineProps> = ({
  skipIntervals,
  onSkipPress,
  preparingText,
  detailText,
}) => {
  const colors = useM3Colors();
  const status = useRemoteStore(state => state.status);
  const seeking = useRemoteStore(state => !!state.pendingSeek);
  const preparingSubtitle = useRemoteStore(state => state.preparingSubtitle);
  const errorMessage = useRemoteStore(state => state.errorMessage);
  const connectedDevice = useRemoteStore(state => state.connectedDevice);
  const currentTime = useRemoteStore(state => state.currentTime);

  const skipInterval = skipIntervals?.find(interval =>
    Number.isFinite(interval.from) && Number.isFinite(interval.to) &&
    interval.to > interval.from && currentTime >= interval.from && currentTime < interval.to,
  );
  const showSkip =
    !!skipInterval &&
    status !== 'error' &&
    currentTime >= skipInterval.from &&
    currentTime < skipInterval.to && !!onSkipPress;

  let content: React.ReactNode;
  if (errorMessage || status === 'error') {
    content = (
      <View style={{alignItems: 'center', flexDirection: 'row', gap: 8}}>
        <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.error} />
        <AppText
          role="bodyMedium"
          numberOfLines={2}
          style={{color: colors.error, flexShrink: 1}}>
          {errorMessage || "The TV couldn't play this video"}
        </AppText>
      </View>
    );
  } else if (preparingSubtitle || preparingText || seeking || status === 'buffering' || status === 'loading' || status === 'connecting') {
    content = (
      <View style={{alignItems: 'center', flexDirection: 'row', gap: 10}}>
        <ActivityIndicator size="small" color={colors.primary} />
        <AppText role="labelLarge" numberOfLines={1} style={{color: colors.primary}}>
          {preparingSubtitle ? 'Preparing subtitles…' : preparingText || (seeking ? 'Seeking…' : 'Buffering…')}
        </AppText>
      </View>
    );
  } else if (showSkip) {
    content = (
      <View style={{alignSelf: 'flex-end'}}>
        <Button variant="tonal" compact onPress={() => onSkipPress?.(skipInterval!.to)}>
          {skipInterval?.title
            ? (/^skip\b/i.test(skipInterval.title) ? skipInterval.title : `Skip ${skipInterval.title}`)
            : 'Skip intro'}
        </Button>
      </View>
    );
  } else {
    const text = !connectedDevice
      ? 'Choose a device to start'
      : status === 'paused'
          ? `Paused on ${connectedDevice.name}`
          : status === 'stopped'
            ? 'Finished'
            : `Playing on ${connectedDevice.name}`;
    content = (
      <AppText role="labelLarge" numberOfLines={1} style={{color: colors.primary}}>
        {text}
      </AppText>
    );
  }

  return (
    <View
      style={{
        alignItems: 'center',
        minHeight: detailText ? 80 : 64,
        flexShrink: 0,
        paddingTop: 8,
        paddingBottom: 0,
        justifyContent: 'flex-end',
        paddingHorizontal: 24,
      }}>
      {!!detailText && (
        <AppText
          role="labelSmall"
          numberOfLines={1}
          style={{color: colors.onSurfaceVariant, marginBottom: 8}}>
          {detailText}
        </AppText>
      )}
      {content}
    </View>
  );
};

import {registerInteractionCommit} from '../../../lib/performance/idleWork';
import {Host, Slider} from '@expo/ui/jetpack-compose';
import {fillMaxWidth} from '@expo/ui/jetpack-compose/modifiers';
import React, {useCallback, useRef, useState} from 'react';
import {View, findNodeHandle} from 'react-native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Surface from '../../../components/ui/Surface';
import AppText from '../../../components/ui/Text';
import {updateDownloadConcurrency} from '../../../lib/downloadManager';
import {
  MAX_DOWNLOAD_CONNECTIONS,
  MIN_DOWNLOAD_CONNECTIONS,
  settingsStorage,
} from '../../../lib/storage';
import SettingsSliderRow from '../../../components/ui/SettingsSliderRow';
import SettingsSwitchRow from '../../../components/ui/SettingsSwitchRow';
import {useM3Colors, useM3HostTheme} from '../../../theme/M3PaletteContext';
import {isTV} from '../../../lib/tv';
import {TVFocusable} from '../../../components/tv/TVFocusable';

const MIN_CONCURRENCY = 1;
const MAX_CONCURRENCY = 5;

const DownloadConcurrencyPreference = ({
  primary: _primary,
}: {
  primary: string;
}) => {
  const colors = useM3Colors();
  const hostTheme = useM3HostTheme();
  const [concurrency, setConcurrency] = useState(
    settingsStorage.getDownloadConcurrency(),
  );
  const [connections, setConnections] = useState(
    settingsStorage.getDownloadConnections(),
  );
  const [autoServerFallback, setAutoServerFallback] = useState(() =>
    settingsStorage.isAutoDownloadServerFallbackEnabled(),
  );
  const prevConcurrencyRef = useRef(concurrency);
  const decreaseRef = useRef<View>(null);
  const increaseRef = useRef<View>(null);
  const [decreaseHandle, setDecreaseHandle] = useState<number | null>(null);
  const [increaseHandle, setIncreaseHandle] = useState<number | null>(null);

  const dirtyRef = useRef(false);
  const commitConcurrency = useCallback(() => {
    if (!dirtyRef.current) return;
    dirtyRef.current = false;
    updateDownloadConcurrency(prevConcurrencyRef.current);
  }, []);
  React.useEffect(
    () => registerInteractionCommit(commitConcurrency),
    [commitConcurrency],
  );
  const update = useCallback(
    (next: number) => {
      const rounded = Math.min(
        Math.max(Math.round(next), MIN_CONCURRENCY),
        MAX_CONCURRENCY,
      );
      if (rounded === prevConcurrencyRef.current) return;
      dirtyRef.current = true;
      if (rounded !== prevConcurrencyRef.current) {
        prevConcurrencyRef.current = rounded;
        if (settingsStorage.isHapticFeedbackEnabled()) {
          ReactNativeHapticFeedback.trigger('effectTick', {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false,
          });
        }
      }
      setConcurrency(rounded);
      if (isTV) commitConcurrency();
    },
    [commitConcurrency],
  );

  return (
    <View className="mb-6">
      <AppText role="labelLarge" className="mb-3 text-m3-on-surface-variant">
        Downloads
      </AppText>
      <Surface level="low" className="overflow-hidden">
        <View className="p-4">
          <View className="flex-row items-center justify-between">
            <View className="mr-4 flex-1">
              <AppText role="bodyLarge" className="text-m3-on-surface">
                Concurrent Downloads
              </AppText>
              <AppText
                role="bodySmall"
                className="mt-1 text-m3-on-surface-variant">
                Extra downloads wait in the queue
              </AppText>
            </View>
            <View
              className="rounded-full px-2.5 py-1"
              style={{backgroundColor: colors.surfaceContainerHighest}}>
              <AppText
                testID="download-concurrency-value"
                role="titleSmall"
                style={{color: colors.primary, fontWeight: '700'}}>
                {concurrency}
              </AppText>
            </View>
          </View>
          <View className="mt-2 w-full">
            {isTV ? (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 6,
                }}>
                <TVFocusable
                  ref={decreaseRef}
                  onLayout={() =>
                    setDecreaseHandle(findNodeHandle(decreaseRef.current))
                  }
                  nextFocusRight={increaseHandle}
                  onPress={() => update(concurrency - 1)}
                  borderRadius={20}
                  focusScale={1.1}
                  accessibilityRole="button"
                  accessibilityLabel="Decrease concurrent downloads"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.surfaceContainerHigh,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <MaterialCommunityIcons
                    name="minus"
                    size={24}
                    color={colors.onSurface}
                  />
                </TVFocusable>

                <View
                  style={{
                    flex: 1,
                    marginHorizontal: 16,
                    height: 8,
                    backgroundColor: colors.surfaceContainerHighest,
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}>
                  <View
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, ((concurrency - MIN_CONCURRENCY) / (MAX_CONCURRENCY - MIN_CONCURRENCY)) * 100))}%`,
                      backgroundColor: colors.primary,
                      borderRadius: 4,
                    }}
                  />
                </View>

                <TVFocusable
                  ref={increaseRef}
                  onLayout={() =>
                    setIncreaseHandle(findNodeHandle(increaseRef.current))
                  }
                  nextFocusLeft={decreaseHandle}
                  onPress={() => update(concurrency + 1)}
                  borderRadius={20}
                  focusScale={1.1}
                  accessibilityRole="button"
                  accessibilityLabel="Increase concurrent downloads"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: colors.surfaceContainerHigh,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                  <MaterialCommunityIcons
                    name="plus"
                    size={24}
                    color={colors.onSurface}
                  />
                </TVFocusable>
              </View>
            ) : (
              <Host
                matchContents={{vertical: true}}
                style={{width: '100%'}}
                {...hostTheme}>
                <Slider
                  value={concurrency}
                  min={MIN_CONCURRENCY}
                  max={MAX_CONCURRENCY}
                  steps={MAX_CONCURRENCY - MIN_CONCURRENCY - 1}
                  colors={{
                    thumbColor: colors.primary,
                    activeTrackColor: colors.primary,
                    inactiveTrackColor: colors.surfaceContainerHighest,
                    activeTickColor: colors.onPrimary,
                    inactiveTickColor: colors.outlineVariant,
                  }}
                  onValueChange={update}
                  onValueChangeFinished={commitConcurrency}
                  modifiers={[fillMaxWidth()]}
                />
              </Host>
            )}
          </View>
        </View>

        <View className="h-px bg-m3-outline-variant" />

        <SettingsSliderRow
          title="Connections per Download"
          description="Faster on servers that limit speed per connection. Applies to new and resumed downloads"
          value={connections}
          min={MIN_DOWNLOAD_CONNECTIONS}
          max={MAX_DOWNLOAD_CONNECTIONS}
          step={1}
          onValueChange={next => {
            setConnections(next);
          }}
          onValueChangeFinished={next =>
            settingsStorage.setDownloadConnections(next)
          }
        />
        <SettingsSwitchRow
          title="Automatically try next server"
          description="Try another compatible server if a download fails before 1%"
          value={autoServerFallback}
          divider={false}
          onValueChange={next => {
            settingsStorage.setAutoDownloadServerFallbackEnabled(next);
            setAutoServerFallback(next);
          }}
        />
      </Surface>
    </View>
  );
};

export default DownloadConcurrencyPreference;

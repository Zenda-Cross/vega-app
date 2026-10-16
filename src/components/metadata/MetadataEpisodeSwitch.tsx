import React from 'react';
import {View} from 'react-native';
import {Host, Switch} from '@expo/ui/jetpack-compose';
import {TVFocusable} from '../tv';
import AppText from '../ui/Text';
import {isTV} from '../../lib/tv/constants';
import {useM3Colors, useM3HostTheme} from '../../theme/M3PaletteContext';
export default function MetadataEpisodeSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  const colors = useM3Colors();
  const hostTheme = useM3HostTheme();
  return (
    <TVFocusable
      accessibilityRole="switch"
      accessibilityLabel="Episode metadata"
      accessibilityState={{checked: value}}
      onPress={() => onChange(!value)}
      borderRadius={20}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        padding: 16,
        borderRadius: 20,
        backgroundColor: colors.surfaceContainer,
      }}>
      <View style={{flex: 1, gap: 4}}>
        <AppText role="titleMedium" style={{color: colors.onSurface}}>
          Episode metadata
        </AppText>
        <AppText role="bodySmall" style={{color: colors.onSurfaceVariant}}>
          Match season and episode numbers to show episode names, descriptions
          and thumbnails. Unmatched episodes keep provider details.
        </AppText>
      </View>
      <View
        pointerEvents={isTV ? 'none' : 'auto'}
        importantForAccessibility={isTV ? 'no-hide-descendants' : 'auto'}
        style={{width: 52, height: 48}}>
        <Host matchContents {...hostTheme} style={{width: 52, height: 48}}>
          <Switch
            enabled={!isTV}
            value={value}
            onCheckedChange={onChange}
            colors={{
              checkedTrackColor: colors.primary,
              checkedThumbColor: colors.onPrimary,
              checkedBorderColor: colors.primary,
              uncheckedTrackColor: colors.surfaceContainerHighest,
              uncheckedThumbColor: colors.outline,
              uncheckedBorderColor: colors.outline,
            }}
          />
        </Host>
      </View>
    </TVFocusable>
  );
}

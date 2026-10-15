import React, {forwardRef, useEffect, useRef, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {Host, Slider} from '@expo/ui/jetpack-compose';
import {fillMaxWidth} from '@expo/ui/jetpack-compose/modifiers';
import {isTV} from '../lib/tv';
import {TVFocusable} from './tv';
import {useM3HostTheme} from '../theme/M3PaletteContext';
import {
  MAX_SLEEP_MINUTES,
  SLEEP_TIMER_OPTIONS,
  SleepTimerOption,
  SleepTimerState,
  getSleepOptionLabel,
} from '../lib/player/sleepTimer';

type Props = {
  timer: SleepTimerState;
  minutesLeft: number | null;
  accentColor: string;
  onSelect: (option: SleepTimerOption) => void;
  onAdjust: (delta: number) => void;
  onTVFocus: () => void;
};
const roundButton = {
  width: 36,
  height: 36,
  borderRadius: 18,
  backgroundColor: '#262626',
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};

const PlayerSleepControl = forwardRef<View, Props>(
  ({timer, minutesLeft, accentColor, onSelect, onAdjust, onTVFocus}, ref) => {
    const hostTheme = useM3HostTheme();
    const [draft, setDraft] = useState(minutesLeft ?? 0);
    const draftRef = useRef(draft);
    const dragging = useRef(false);
    useEffect(() => {
      if (dragging.current) return;
      draftRef.current = minutesLeft ?? 0;
      setDraft(draftRef.current);
    }, [minutesLeft, timer]);
    const preview = (minutes: number) => {
      dragging.current = true;
      draftRef.current = Math.max(
        0,
        Math.min(MAX_SLEEP_MINUTES, Math.round(minutes / 5) * 5),
      );
      setDraft(draftRef.current);
    };
    return (
      <ScrollView
        style={{width: '100%', height: '100%'}}
        contentContainerStyle={{paddingHorizontal: 8, paddingBottom: 8}}>
        <Text
          style={{
            color: 'white',
            fontSize: 15,
            fontWeight: '700',
            textAlign: 'center',
            marginBottom: 2,
          }}>
          Sleep timer
        </Text>
        <Text
          accessibilityLiveRegion="polite"
          style={{
            color: 'white',
            fontSize: 19,
            fontWeight: '700',
            textAlign: 'center',
            fontVariant: ['tabular-nums'],
          }}>
          {draft > 0
            ? `${draft} min left`
            : timer.option === 'episode' && !dragging.current
              ? 'End of episode'
              : 'Off'}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginVertical: 4,
          }}>
          <TVFocusable
            ref={ref}
            registerScreenFocus={false}
            hasTVPreferredFocus={isTV}
            onFocus={onTVFocus}
            accessibilityRole="button"
            accessibilityLabel="Subtract 5 minutes"
            onPress={() => onAdjust(-5)}
            borderRadius={18}
            focusBorderColor={accentColor}
            style={roundButton}>
            <MaterialCommunityIcons
              name="minus"
              size={22}
              color={draft === 0 ? '#777777' : 'white'}
            />
          </TVFocusable>
          <View style={{flex: 1}}>
            {isTV ? (
              <View
                style={{
                  height: 6,
                  backgroundColor: '#555555',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}>
                <View
                  style={{
                    height: '100%',
                    width: `${(draft / MAX_SLEEP_MINUTES) * 100}%`,
                    backgroundColor: accentColor,
                  }}
                />
              </View>
            ) : (
              <Host
                matchContents={{vertical: true}}
                style={{width: '100%'}}
                {...hostTheme}>
                <Slider
                  value={draft}
                  min={0}
                  max={MAX_SLEEP_MINUTES}
                  steps={MAX_SLEEP_MINUTES / 5 - 1}
                  onValueChange={preview}
                  onValueChangeFinished={() => {
                    dragging.current = false;
                    onSelect(draftRef.current === 0 ? 'off' : draftRef.current);
                  }}
                  colors={{
                    thumbColor: accentColor,
                    activeTrackColor: accentColor,
                    inactiveTrackColor: '#555555',
                    activeTickColor: '#171717',
                    inactiveTickColor: '#999999',
                  }}
                  modifiers={[fillMaxWidth()]}
                />
              </Host>
            )}
          </View>
          <TVFocusable
            registerScreenFocus={false}
            onFocus={onTVFocus}
            accessibilityRole="button"
            accessibilityLabel="Add 5 minutes"
            onPress={() => onAdjust(5)}
            borderRadius={18}
            focusBorderColor={accentColor}
            style={roundButton}>
            <MaterialCommunityIcons
              name="plus"
              size={22}
              color={draft >= MAX_SLEEP_MINUTES ? '#777777' : 'white'}
            />
          </TVFocusable>
        </View>
        <Text
          style={{
            color: '#bbbbbb',
            textAlign: 'center',
            fontSize: 12,
            marginBottom: 6,
          }}>
          Adjust by 5 minutes
        </Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
          {SLEEP_TIMER_OPTIONS.map(option => {
            const selected =
              typeof option === 'number'
                ? draft === option
                : timer.option === option;
            return (
              <TVFocusable
                key={String(option)}
                registerScreenFocus={false}
                onFocus={onTVFocus}
                accessibilityRole="button"
                accessibilityLabel={getSleepOptionLabel(option)}
                accessibilityState={{selected}}
                borderRadius={18}
                focusBorderColor={accentColor}
                onPress={() => {
                  dragging.current = false;
                  onSelect(option);
                }}
                style={{
                  minWidth: 68,
                  minHeight: 34,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 18,
                  backgroundColor: selected ? '#444444' : '#262626',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text
                  style={{
                    color: selected ? accentColor : 'white',
                    fontSize: 13,
                    fontWeight: '700',
                  }}>
                  {typeof option === 'number'
                    ? `${option} min`
                    : getSleepOptionLabel(option)}
                </Text>
              </TVFocusable>
            );
          })}
        </View>
      </ScrollView>
    );
  },
);
export default PlayerSleepControl;

import React, {forwardRef, useEffect, useState} from 'react';
import {ScrollView, Text, View} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {Host, Slider} from '@expo/ui/jetpack-compose';
import {fillMaxWidth} from '@expo/ui/jetpack-compose/modifiers';
import {
  PLAYBACK_SPEEDS,
  PLAYBACK_SPEED_MIN as MIN,
  PLAYBACK_SPEED_MAX as MAX,
  PLAYBACK_SPEED_STEP as STEP,
} from '../lib/storage';
import {isTV} from '../lib/tv';
import {TVFocusable} from './tv';
import {useM3HostTheme} from '../theme/M3PaletteContext';

type Props = {
  value: number;
  accentColor: string;
  onChange: (speed: number) => void;
  onTVFocus: () => void;
};

const snapSpeed = (speed: number) =>
  Number(
    Math.max(MIN, Math.min(MAX, Math.round(speed / STEP) * STEP)).toFixed(2),
  );

const PlayerSpeedControl = forwardRef<View, Props>(
  ({value, accentColor, onChange, onTVFocus}, ref) => {
    const hostTheme = useM3HostTheme();
    const [draft, setDraft] = useState(value);
    const draftRef = React.useRef(value);
    useEffect(() => {
      draftRef.current = value;
      setDraft(value);
    }, [value]);

    const preview = (speed: number) => {
      const next = snapSpeed(speed);
      draftRef.current = next;
      setDraft(next);
    };
    const select = (speed: number) => {
      const next = snapSpeed(speed);
      preview(next);
      onChange(next);
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
          Playback speed
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
          {draft.toFixed(2)}x
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
            accessibilityLabel="Decrease playback speed"
            onPress={() => select(draftRef.current - STEP)}
            borderRadius={18}
            focusBorderColor={accentColor}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#262626',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <MaterialCommunityIcons
              name="minus"
              size={22}
              color={draft <= MIN ? '#777777' : 'white'}
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
                    width: `${((draft - MIN) / (MAX - MIN)) * 100}%`,
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
                  min={MIN}
                  max={MAX}
                  steps={Math.round((MAX - MIN) / STEP) - 1}
                  onValueChange={preview}
                  onValueChangeFinished={() => onChange(draftRef.current)}
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
            accessibilityLabel="Increase playback speed"
            onPress={() => select(draftRef.current + STEP)}
            borderRadius={18}
            focusBorderColor={accentColor}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#262626',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <MaterialCommunityIcons
              name="plus"
              size={22}
              color={draft >= MAX ? '#777777' : 'white'}
            />
          </TVFocusable>
        </View>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
          {PLAYBACK_SPEEDS.map(speed => (
            <TVFocusable
              key={speed}
              registerScreenFocus={false}
              onFocus={onTVFocus}
              accessibilityRole="button"
              accessibilityLabel={`${speed}x${speed === 1 ? ', Normal' : ''}`}
              accessibilityState={{selected: draft === speed}}
              borderRadius={18}
              focusBorderColor={accentColor}
              onPress={() => select(speed)}
              style={{
                minWidth: 60,
                minHeight: 34,
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 18,
                backgroundColor: draft === speed ? '#444444' : '#262626',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  color: draft === speed ? accentColor : 'white',
                  fontSize: 13,
                  fontWeight: '700',
                }}>
                {Number.isInteger(speed) ? speed.toFixed(1) : speed}x
              </Text>
              {speed === 1 && (
                <Text style={{color: '#bbbbbb', fontSize: 10}}>Normal</Text>
              )}
            </TVFocusable>
          ))}
        </View>
      </ScrollView>
    );
  },
);

export default PlayerSpeedControl;

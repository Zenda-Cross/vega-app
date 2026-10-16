import React, {useEffect, useRef, useState} from 'react';
import {Platform, Switch, Text, View} from 'react-native';
import {Host, Slider} from '@expo/ui/jetpack-compose';
import {fillMaxWidth} from '@expo/ui/jetpack-compose/modifiers';
import {useM3HostTheme} from '../theme/M3PaletteContext';
import {isTV} from '../lib/tv/constants';
import {TVFocusable} from './tv';
import {PlayerControlStyle} from '../lib/player/controlStyle';
import PlayerControlBar, {PlayerControl} from './PlayerControlBar';

function StyleSlider({
  label,
  value,
  min,
  max,
  step,
  format,
  color,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  color: string;
  onChange: (value: number) => void;
}) {
  const theme = useM3HostTheme();
  const [preview, setPreview] = useState(value);
  const draft = useRef(value);
  useEffect(() => {
    draft.current = value;
    setPreview(value);
  }, [value]);
  const change = (next: number) => {
    draft.current = Math.max(
      min,
      Math.min(max, Math.round(next / step) * step),
    );
    setPreview(draft.current);
  };
  return (
    <View style={{marginTop: 12}}>
      <Text style={{color: '#bbb', fontSize: 12}}>
        {label} · {format(preview)}
      </Text>
      {isTV ? (
        <View style={{flexDirection: 'row', gap: 12, marginTop: 8}}>
          {[-step, step].map(delta => (
            <TVFocusable
              key={delta}
              registerScreenFocus={false}
              accessibilityLabel={`${delta < 0 ? 'Decrease' : 'Increase'} ${label}`}
              onPress={() => {
                change(draft.current + delta);
                onChange(draft.current);
              }}
              style={{
                padding: 10,
                backgroundColor: '#292929',
                borderRadius: 16,
              }}>
              <Text style={{color: 'white'}}>{delta < 0 ? '−' : '+'}</Text>
            </TVFocusable>
          ))}
        </View>
      ) : (
        <Host
          matchContents={{vertical: true}}
          style={{width: '100%'}}
          {...theme}>
          <Slider
            value={preview}
            min={min}
            max={max}
            steps={Math.round((max - min) / step) - 1}
            onValueChange={change}
            onValueChangeFinished={() => onChange(draft.current)}
            colors={{
              thumbColor: color,
              activeTrackColor: color,
              inactiveTrackColor: '#555',
            }}
            modifiers={[fillMaxWidth()]}
          />
        </Host>
      )}
    </View>
  );
}

const PREVIEW: PlayerControl[] = [
  {
    id: 'audio',
    title: 'Audio',
    label: 'Japanese',
    shortLabel: 'Ja',
    icon: 'waveform',
    visible: true,
    onPress: () => {},
  },
  {
    id: 'subtitle',
    title: 'Subtitles',
    label: 'English',
    shortLabel: 'En',
    icon: 'subtitles-outline',
    visible: true,
    onPress: () => {},
  },
  {
    id: 'speed',
    title: 'Speed',
    label: '1.0x',
    icon: 'speedometer',
    visible: true,
    onPress: () => {},
  },
];
const percent = (n: number) => `${Math.round(n * 100)}%`;

export default function PlayerControlStyleEditor({
  value,
  color,
  onChange,
  ambient,
  onAmbientChange,
}: {
  ambient?: {enabled: boolean; intensity: number};
  onAmbientChange?: (value: {enabled: boolean; intensity: number}) => void;
  value: PlayerControlStyle;
  color: string;
  onChange: (style: PlayerControlStyle) => void;
}) {
  const choices = <K extends 'labels' | 'alignment'>(
    key: K,
    title: string,
    options: [PlayerControlStyle[K], string][],
  ) => (
    <View style={{marginTop: 12}}>
      <Text style={{color: '#bbb', fontSize: 12, marginBottom: 8}}>
        {title}
      </Text>
      <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8}}>
        {options.map(([option, label]) => (
          <TVFocusable
            key={option}
            registerScreenFocus={false}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{selected: value[key] === option}}
            onPress={() => onChange({...value, [key]: option})}
            borderRadius={18}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 18,
              backgroundColor: value[key] === option ? color : '#292929',
            }}>
            <Text
              style={{
                fontSize: 12,
                color: value[key] === option ? '#111' : '#bbb',
              }}>
              {label}
            </Text>
          </TVFocusable>
        ))}
      </View>
    </View>
  );
  return (
    <View>
      <View style={{padding: 10, backgroundColor: '#343a40', borderRadius: 12}}>
        <Text
          numberOfLines={1}
          style={{color: '#ccc', fontSize: 18 * value.scale, marginBottom: 10}}>
          Title preview
        </Text>
        <PlayerControlBar
          ids={['audio', 'subtitle', 'speed']}
          controls={PREVIEW}
          appearance={value}
          onEdit={() => {}}
          getTVFocusProps={() => ({})}
        />
      </View>
      {Platform.OS === 'android' && ambient && onAmbientChange && (
        <View style={{marginTop: 12}}>
          <TVFocusable
            registerScreenFocus={false}
            accessibilityRole="switch"
            accessibilityLabel="Ambient lighting"
            accessibilityState={{checked: ambient.enabled}}
            onPress={() => onAmbientChange({...ambient, enabled: !ambient.enabled})}
            borderRadius={18}
            style={{padding: 12, borderRadius: 18, backgroundColor: '#292929', flexDirection: 'row', alignItems: 'center', gap: 12}}>
            <View style={{flex: 1}}>
              <Text style={{color: '#bbb', fontSize: 12}}>Ambient lighting</Text>
              <Text style={{color: '#999', fontSize: 11, marginTop: 4}}>
                Soft video colors in the black bars around the picture
              </Text>
            </View>
            <Switch
              value={ambient.enabled}
              focusable={false}
              pointerEvents={isTV ? 'none' : 'auto'}
              importantForAccessibility={isTV ? 'no' : 'auto'}
              accessibilityElementsHidden={isTV}
              accessibilityLabel="Ambient lighting"
              onValueChange={isTV ? undefined : enabled => onAmbientChange({...ambient, enabled})}
              thumbColor={ambient.enabled ? '#fff' : '#bbb'}
              trackColor={{false: '#555', true: color}}
            />
          </TVFocusable>
          {ambient.enabled && <StyleSlider
            label="Ambient intensity" value={ambient.intensity}
            min={0} max={1} step={0.05} format={percent} color={color}
            onChange={intensity => onAmbientChange({...ambient, intensity})}
          />}
        </View>
      )}
      {choices('labels', 'Bottom labels', [
        ['full', 'Full'],
        ['short', 'Short'],
        ['hidden', 'Hidden'],
      ])}
      {choices('alignment', 'Bottom alignment', [
        ['distributed', 'Even spacing'],
        ['center', 'Centered'],
        ['left', 'Left'],
        ['right', 'Right'],
      ])}
      <StyleSlider
        label="Row background opacity"
        value={value.backgroundOpacity}
        min={0}
        max={1}
        step={0.05}
        format={percent}
        color={color}
        onChange={backgroundOpacity => onChange({...value, backgroundOpacity})}
      />
      <StyleSlider
        label="Seekbar height · track, knob and markers"
        value={value.seekbarScale}
        min={0.75}
        max={2}
        step={0.25}
        format={percent}
        color={color}
        onChange={seekbarScale => onChange({...value, seekbarScale})}
      />
      <StyleSlider
        label="Player scale · icons, labels and title"
        value={value.scale}
        min={0.75}
        max={1.4}
        step={0.05}
        format={percent}
        color={color}
        onChange={scale => onChange({...value, scale})}
      />
    </View>
  );
}

import React from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {isTV} from '../lib/tv/constants';
import {PlayerControlId} from '../lib/player/controlLayout';

export type PlayerControl = {
  id: PlayerControlId;
  title: string;
  label: string;
  icon: string;
  materialIcon?: boolean;
  visible: boolean;
  onPress: () => void;
};
export const PLAYER_CONTROL_COLOR = 'rgba(255,255,255,0.6)';
const Button = isTV ? Pressable : TouchableOpacity;
const BOTTOM_EDGE_PADDING = 12;

export function PlayerControlIcon({
  control,
  size = 24,
}: {
  control: PlayerControl;
  size?: number;
}) {
  return control.materialIcon ? (
    <MaterialIcons
      name={control.icon as any}
      size={size}
      color={PLAYER_CONTROL_COLOR}
    />
  ) : (
    <MaterialCommunityIcons
      name={control.icon as any}
      size={size}
      color={PLAYER_CONTROL_COLOR}
    />
  );
}

type Props = {
  ids: PlayerControlId[];
  controls: PlayerControl[];
  top?: boolean;
  onEdit: () => void;
  getTVFocusProps: (id: string) => {style?: StyleProp<ViewStyle>};
};

export default function PlayerControlBar({
  ids,
  controls,
  top,
  onEdit,
  getTVFocusProps,
}: Props) {
  const visible = ids
    .map(id => controls.find(control => control.id === id))
    .filter((control): control is PlayerControl => Boolean(control?.visible));
  const children = visible.map(control => {
    const focusProps = getTVFocusProps(control.id);
    return (
      <Button
        key={control.id}
        {...focusProps}
        accessibilityRole="button"
        accessibilityLabel={`${control.title}, ${control.label}`}
        accessibilityHint="Hold to edit player controls"
        onPress={control.onPress}
        onLongPress={onEdit}
        delayLongPress={500}
        style={[
          focusProps.style,
          !top && {
            minHeight: 44,
            flexShrink: 0,
          },
        ]}
        className={
          top
            ? 'p-2 items-center justify-center rounded-full'
            : 'flex-row items-center justify-center gap-1 px-1 py-1'
        }>
        <PlayerControlIcon control={control} />
        {!top && (
          <Text
            numberOfLines={1}
            style={{
              color: PLAYER_CONTROL_COLOR,
              fontSize: 12,
              fontWeight: '300',
              flexShrink: 0,
            }}>
            {control.label}
          </Text>
        )}
      </Button>
    );
  });
  if (top)
    return <View style={{flexDirection: 'row', gap: 8}}>{children}</View>;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      bounces={false}
      style={{width: '100%'}}
      contentContainerStyle={{
        alignItems: 'center',
        justifyContent: visible.length === 1 ? 'center' : 'space-between',
        columnGap: 20,
        flexGrow: 1,
        minWidth: '100%',
        paddingHorizontal: BOTTOM_EDGE_PADDING,
      }}>
      {children}
    </ScrollView>
  );
}

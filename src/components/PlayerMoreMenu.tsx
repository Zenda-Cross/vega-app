import React from 'react';
import {Modal, ScrollView, Text, View} from 'react-native';
import {TVFocusable, TVFocusGuide} from './tv';
import {PlayerControl, PlayerControlIcon} from './PlayerControlBar';
import {PlayerControlStyle} from '../lib/player/controlStyle';

export default function PlayerMoreMenu({
  controls,
  appearance,
  color,
  onClose,
}: {
  controls: PlayerControl[];
  appearance: PlayerControlStyle;
  color: string;
  onClose: () => void;
}) {
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}>
        <TVFocusGuide
          trapFocusLeft
          trapFocusRight
          trapFocusUp
          trapFocusDown
          style={{
            width: '85%',
            maxWidth: 440,
            maxHeight: '90%',
            padding: 14,
            backgroundColor: '#171717',
            borderRadius: 20,
          }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
            }}>
            <Text
              numberOfLines={1}
              style={{
                color: 'white',
                fontSize: 16 * appearance.scale,
                flex: 1,
              }}>
              Settings
            </Text>
            <TVFocusable
              registerScreenFocus={false}
              accessibilityLabel="Close settings"
              onPress={onClose}
              style={{padding: 10}}>
              <Text style={{color: '#ccc'}}>Close</Text>
            </TVFocusable>
          </View>
          <ScrollView
            style={{flexShrink: 1}}
            showsVerticalScrollIndicator={false}>
            {controls.map((control, i) => (
              <TVFocusable
                key={control.id}
                registerScreenFocus={false}
                hasTVPreferredFocus={i === 0}
                accessibilityRole="button"
                accessibilityLabel={`${control.title}, ${control.label}`}
                focusBorderColor={color}
                borderRadius={12}
                onPress={() => {
                  onClose();
                  control.onPress();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  minHeight: 44,
                }}>
                <PlayerControlIcon
                  control={control}
                  size={24 * appearance.scale}
                />
                <View style={{flex: 1}}>
                  <Text
                    numberOfLines={1}
                    style={{color: '#eee', fontSize: 14 * appearance.scale}}>
                    {control.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{color: '#aaa', fontSize: 12 * appearance.scale}}>
                    {appearance.labels === 'short'
                      ? control.shortLabel || control.label
                      : control.label}
                  </Text>
                </View>
              </TVFocusable>
            ))}
          </ScrollView>
        </TVFocusGuide>
      </View>
    </Modal>
  );
}

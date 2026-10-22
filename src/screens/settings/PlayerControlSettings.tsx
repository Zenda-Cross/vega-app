import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useCallback, useState} from 'react';
import {BackHandler, View} from 'react-native';
import type {SettingsStackParamList} from '../../App';
import PlayerControlArrangement from '../../components/PlayerControlArrangement';
import SettingsRow from '../../components/ui/SettingsRow';
import {TVFocusGuide} from '../../components/tv';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import type {PlayerControl} from '../../components/PlayerControlBar';
import {PLAYER_CONTROL_IDS} from '../../lib/player/controlLayout';
import {settingsStorage} from '../../lib/storage';
import {isTV} from '../../lib/tv';
import {useM3Colors} from '../../theme/M3PaletteContext';

const descriptors: Record<typeof PLAYER_CONTROL_IDS[number], [string, string]> = {
  sleep: ['Sleep timer', 'power-sleep'],
  lock: ['Lock', 'lock-outline'],
  cast: ['Cast', 'cast'],
  audio: ['Audio', 'waveform'],
  subtitle: ['Subtitles', 'subtitles-outline'],
  speed: ['Speed', 'speedometer'],
  pip: ['Picture in picture', 'picture-in-picture-bottom-right'],
  server: ['Server', 'server'],
  resize: ['Resize', 'aspect-ratio'],
  episodes: ['Episodes', 'playlist-play'],
  next: ['Next episode', 'skip-next'],
  settings: ['Settings', 'cog-outline'],
  decoder: ['Video decoder', 'memory'],
};
const controls: PlayerControl[] = PLAYER_CONTROL_IDS.map(id => ({
  id,
  title: descriptors[id][0],
  label: descriptors[id][0],
  icon: descriptors[id][1],
  visible: true,
  onPress: () => {},
}));

type Props = NativeStackScreenProps<SettingsStackParamList, 'PlayerControlSettings'>;
export default function PlayerControlSettings({navigation}: Props) {
  const colors = useM3Colors();
  const [layout, setLayout] = useState(() => settingsStorage.getPlayerControlLayout());
  const [hidden, setHidden] = useState(() => settingsStorage.getHiddenPlayerControls());
  useFocusEffect(useCallback(() => {
    if (!isTV) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {navigation.goBack(); return true;});
    return () => sub.remove();
  }, [navigation]));
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <TVFocusGuide autoFocus style={{flex: 1, backgroundColor: colors.background, padding: 16}}>
        <SettingsRow title="Control layout" description="Changes save automatically"
          icon="arrow-left" onPress={() => navigation.goBack()} hasTVPreferredFocus={isTV} />
        <View style={{flex: 1, paddingTop: 12}}>
          <PlayerControlArrangement page layout={layout} hiddenControls={hidden} controls={controls}
            color={colors.primary} onChange={(next, nextHidden) => {
              settingsStorage.setPlayerControlLayout(next);
              settingsStorage.setHiddenPlayerControls(nextHidden);
              setLayout(next); setHidden(nextHidden);
            }} />
        </View>
      </TVFocusGuide>
    </GestureHandlerRootView>
  );
}

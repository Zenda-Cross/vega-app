// @ts-nocheck
import React, {createRef} from 'react';
import {Platform, TouchableHighlight} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {Control} from '../Control';
import {NullControl} from '../NullControl';
import type {VideoAnimations} from '../../types';
import {styles} from './styles';
import {Loader} from '../Loader';

export const playPauseRef = createRef<TouchableHighlight>();

interface PlayPauseProps {
  animations: VideoAnimations;
  disablePlayPause: boolean;
  paused: boolean;
  buffering: boolean;
  togglePlayPause: () => void;
  resetControlTimeout: () => void;
  showControls: boolean;
  primaryColor: string;
  controlScale?: number;
}

// The rewind/forward buttons live in their own layer (see SeekControls) so the
// double-tap seek animation stays visible while the controls are hidden.
export const PlayPause = ({
  animations: {AnimatedView, ...animations},
  disablePlayPause,
  paused,
  buffering,
  togglePlayPause,
  resetControlTimeout,
  showControls,
  primaryColor,
  controlScale = 1,
}: PlayPauseProps) => {
  const animatedStyles = {
    zIndex: 99999,
  };

  if (disablePlayPause) {
    return <NullControl />;
  }

  return (
    <AnimatedView
      pointerEvents={showControls ? 'box-none' : 'none'}
      style={[styles.container, animatedStyles, animations.controlsOpacity]}>
      <Control
        disabled={!showControls}
        callback={togglePlayPause}
        resetControlTimeout={resetControlTimeout}
        style={styles.playContainer}
        controlRef={playPauseRef}
        {...(Platform.isTV ? {hasTVPreferredFocus: showControls} : {})}>
        {buffering ? (
          <Loader color={primaryColor} />
        ) : (
          <MaterialIcons
            name={paused ? 'play-arrow' : 'pause'}
            size={70 * controlScale}
            color="rgba(255,255,255,0.94)"
            style={Platform.isTV && paused ? {marginLeft: 4} : undefined}
          />
        )}
      </Control>
    </AnimatedView>
  );
};

import React, {memo} from 'react';
import {
  // ImageBackground,
  SafeAreaView,
  StyleSheet,
  View,
  GestureResponderHandlers,
} from 'react-native';
import {Volume} from './Volume';
import {Back} from './Back';
import {NullControl} from './NullControl';
// import {styles} from './styles';
import type {VideoAnimations} from '../types';
import {Title} from './Title';

interface TopControlProps {
  title: {primary: string; secondary?: string};
  headerStatus?: string;
  headerRightInset?: number;
  controlScale?: number;
  showControls: boolean;
  panHandlers: GestureResponderHandlers;
  animations: VideoAnimations;
  disableBack: boolean;
  disableVolume: boolean;
  volumeFillWidth: number;
  volumeTrackWidth: number;
  volumePosition: number;
  onBack: () => void;
  resetControlTimeout: () => void;
}

export const TopControls = memo(
  ({
    title,
    headerStatus,
    headerRightInset = 0,
    controlScale = 1,
    showControls,
    panHandlers,
    animations: {AnimatedView, controlsOpacity, topControl},
    disableBack,
    disableVolume,
    volumeFillWidth,
    volumePosition,
    volumeTrackWidth,
    onBack,
    resetControlTimeout,
  }: TopControlProps) => {
    const backControl = disableBack ? (
      <NullControl />
    ) : (
      <Back
        scale={controlScale}
        showControls={showControls}
        onBack={onBack}
        resetControlTimeout={resetControlTimeout}
      />
    );

    const volumeControl = disableVolume ? (
      <NullControl />
    ) : (
      <Volume
        volumeFillWidth={volumeFillWidth}
        volumeTrackWidth={volumeTrackWidth}
        volumePosition={volumePosition}
        volumePanHandlers={panHandlers}
      />
    );

    return (
      <AnimatedView
        pointerEvents={showControls ? 'box-none' : 'none'}
        style={[_styles.top, controlsOpacity, topControl]}>
        <SafeAreaView style={_styles.topControlGroup}>
          <View style={[_styles.sideControl, {marginRight: Math.max(0, headerRightInset - 48)}]}>
            {backControl}
            <Title {...title} status={headerStatus} scale={controlScale} />
          </View>
          <View style={_styles.pullRight}>{volumeControl}</View>
        </SafeAreaView>
      </AnimatedView>
    );
  },
);

const _styles = StyleSheet.create({
  pullRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  top: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  topControlGroup: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    margin: 12,
    marginTop: 4,
    marginBottom: 18,
  },
  sideControl: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import {StyleSheet} from 'react-native';
import React from 'react';
import {BlurView} from 'expo-blur';
import LinearGradient from 'react-native-linear-gradient';

const TabBarBackgound = () => {
  return (
    <>
      <BlurView
        style={StyleSheet.absoluteFill}
        experimentalBlurMethod="dimezisBlurView"
        intensity={30}
        blurReductionFactor={3}
        tint="dark"
      />
      <LinearGradient
        colors={[
          'rgba(0, 0, 0, 0.0)',
          'rgba(0, 0, 0, 0.3)',
          'rgba(0, 0, 0, 0.5)',
          'rgba(0, 0, 0, 0.8)',
          'rgba(0, 0, 0, 1)',
        ]}
        style={StyleSheet.absoluteFill}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
      />
    </>
  );
};

export default TabBarBackgound;

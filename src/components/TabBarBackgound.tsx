import {StyleSheet} from 'react-native';
import React from 'react';
import {BlurView} from 'expo-blur';
import LinearGradient from 'react-native-linear-gradient';

const TabBarBackgound = () => {
  return (
    <>
      <BlurView style={StyleSheet.absoluteFill} intensity={100} tint="dark" />
      <LinearGradient
        colors={[
          'rgba(0, 0, 0, 0.0)',
          'rgba(0, 0, 0, 0.5)',
          'rgba(0, 0, 0, 0.7)',
          'rgba(0, 0, 0, 9)',
        ]}
        style={StyleSheet.absoluteFill}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
      />
    </>
  );
};

export default TabBarBackgound;

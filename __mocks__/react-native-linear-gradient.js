import React from 'react';
import { View } from 'react-native';

const LinearGradient = ({ children, ...props }) => (
  <View {...props}>{children}</View>
);

export default LinearGradient; 
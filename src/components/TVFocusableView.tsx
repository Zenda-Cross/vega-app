import React, { useRef, useState } from 'react';
import { View, ViewProps, StyleSheet, Animated, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import usePlatform from '../hooks/usePlatform';

interface TVFocusableViewProps extends TouchableOpacityProps {
  children: React.ReactNode;
  focusedScale?: number;
  focusedBorderColor?: string;
  focusedBorderWidth?: number;
  focusedElevation?: number;
  onFocus?: () => void;
  onBlur?: () => void;
}

/**
 * A component that provides TV-friendly focus behavior.
 * On TV devices, it shows focus indicators and handles D-pad navigation.
 * On non-TV devices, it behaves like a regular TouchableOpacity.
 */
const TVFocusableView: React.FC<TVFocusableViewProps> = ({
  children,
  focusedScale = 1.05,
  focusedBorderColor = '#2196F3',
  focusedBorderWidth = 2,
  focusedElevation = 5,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const { isTV } = usePlatform();
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Only apply TV-specific behaviors if running on a TV
  const handleFocus = () => {
    if (isTV) {
      setIsFocused(true);
      Animated.spring(scaleAnim, {
        toValue: focusedScale,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }).start();
      
      if (onFocus) {
        onFocus();
      }
    }
  };
  
  const handleBlur = () => {
    if (isTV) {
      setIsFocused(false);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        tension: 40,
        useNativeDriver: true,
      }).start();
      
      if (onBlur) {
        onBlur();
      }
    }
  };
  
  // Apply TV-specific styles when on a TV device
  const tvStyles = isTV ? {
    transform: [{ scale: scaleAnim }],
    borderColor: isFocused ? focusedBorderColor : 'transparent',
    borderWidth: isFocused ? focusedBorderWidth : 0,
    elevation: isFocused ? focusedElevation : 0,
  } : {};
  
  return (
    <TouchableOpacity
      {...props}
      onFocus={handleFocus}
      onBlur={handleBlur}
      activeOpacity={isTV ? 1 : 0.7} // No opacity change on TV
      style={[styles.container, style, tvStyles]}
    >
      {children}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 4,
  },
});

export default TVFocusableView; 
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import TVNavigation from './TVNavigation';

const { width, height } = Dimensions.get('window');

interface TVLayoutProps {
  children: React.ReactNode;
}

const TVLayout = ({ children }: TVLayoutProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {children}
      </View>
      <TVNavigation />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    paddingBottom: 80, // Space for navigation
  }
});

export default TVLayout; 
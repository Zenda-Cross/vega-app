import React, { useEffect, useState } from 'react';
import { View, Text, BackHandler, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import useThemeStore from '../lib/zustand/themeStore';

const TVNavigation = () => {
  const navigation = useNavigation();
  const [focusedItem, setFocusedItem] = useState(0);
  const { primary } = useThemeStore(state => state);

  const menuItems = [
    { name: 'Home', icon: 'home', route: 'HomeStack' },
    { name: 'Search', icon: 'search', route: 'SearchStack' },
    { name: 'Watch List', icon: 'folder-video', route: 'WatchListStack' },
    { name: 'Settings', icon: 'settings', route: 'SettingsStack' }
  ];

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
          setFocusedItem(prev => (prev + 1) % menuItems.length);
          break;
        case 'ArrowLeft':
          setFocusedItem(prev => (prev - 1 + menuItems.length) % menuItems.length);
          break;
        case 'Enter':
          navigation.navigate(menuItems[focusedItem].route);
          break;
      }
    };

    // Add event listener for keyboard/remote control
    document.addEventListener('keydown', handleKeyPress);

    // Handle back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return true;
      }
      return false;
    });

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      backHandler.remove();
    };
  }, [focusedItem, navigation]);

  return (
    <View style={styles.container}>
      {menuItems.map((item, index) => (
        <TouchableOpacity
          key={item.route}
          style={[
            styles.menuItem,
            focusedItem === index && { borderColor: primary, borderWidth: 2 }
          ]}
          onFocus={() => setFocusedItem(index)}
          onPress={() => navigation.navigate(item.route)}>
          {item.icon === 'folder-video' ? (
            <Entypo
              name={item.icon}
              size={24}
              color={focusedItem === index ? primary : '#dadde3'}
            />
          ) : (
            <Ionicons
              name={focusedItem === index ? item.icon : `${item.icon}-outline`}
              size={24}
              color={focusedItem === index ? primary : '#dadde3'}
            />
          )}
          <Text style={[
            styles.menuText,
            { color: focusedItem === index ? primary : '#dadde3' }
          ]}>
            {item.name}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingVertical: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0
  },
  menuItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 100
  },
  menuText: {
    marginTop: 4,
    fontSize: 16
  }
});

export default TVNavigation; 
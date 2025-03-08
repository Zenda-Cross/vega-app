import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { MMKV } from '../lib/Mmkv';
import useThemeStore from '../lib/zustand/themeStore';
import Ionicons from '@expo/vector-icons/Ionicons';

interface SettingItem {
  title: string;
  description: string;
  type: 'toggle' | 'select' | 'action';
  key: string;
  value?: boolean;
  options?: string[];
  action?: () => void;
}

const TVSettings = () => {
  const { primary } = useThemeStore(state => state);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [settings, setSettings] = useState<SettingItem[]>([
    {
      title: 'Auto Play Next Episode',
      description: 'Automatically play the next episode when current one ends',
      type: 'toggle',
      key: 'autoPlayNext',
      value: MMKV.getBool('autoPlayNext') ?? true,
    },
    {
      title: 'Show Thumbnails',
      description: 'Show video thumbnails in the player',
      type: 'toggle',
      key: 'showThumbnails',
      value: MMKV.getBool('showThumbnails') ?? true,
    },
    {
      title: 'Preferred Quality',
      description: 'Select default video quality',
      type: 'select',
      key: 'preferredQuality',
      options: ['Auto', '1080p', '720p', '480p'],
    },
    {
      title: 'Clear Watch History',
      description: 'Remove all watched videos from history',
      type: 'action',
      key: 'clearHistory',
      action: () => {
        MMKV.removeItem('watchHistory');
      },
    },
  ]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          setSelectedIndex(prev => Math.min(prev + 1, settings.length - 1));
          break;
        case 'ArrowUp':
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          const setting = settings[selectedIndex];
          if (setting.type === 'toggle') {
            const newValue = !setting.value;
            MMKV.setBool(setting.key, newValue);
            setSettings(prev =>
              prev.map((item, i) =>
                i === selectedIndex ? { ...item, value: newValue } : item
              )
            );
          } else if (setting.type === 'action' && setting.action) {
            setting.action();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [selectedIndex, settings]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>TV Settings</Text>
      <View style={styles.settingsList}>
        {settings.map((setting, index) => (
          <TouchableOpacity
            key={setting.key}
            style={[
              styles.settingItem,
              selectedIndex === index && {
                borderColor: primary,
                borderWidth: 2,
              },
            ]}>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>{setting.title}</Text>
              <Text style={styles.settingDescription}>{setting.description}</Text>
            </View>
            <View style={styles.settingControl}>
              {setting.type === 'toggle' && (
                <Switch
                  value={setting.value}
                  onValueChange={() => {}}
                  trackColor={{ false: '#767577', true: primary }}
                />
              )}
              {setting.type === 'select' && (
                <Ionicons name="chevron-forward" size={24} color="#fff" />
              )}
              {setting.type === 'action' && (
                <Ionicons name="arrow-forward" size={24} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 40,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  settingsList: {
    gap: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 10,
  },
  settingContent: {
    flex: 1,
    marginRight: 20,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 20,
    marginBottom: 5,
  },
  settingDescription: {
    color: '#999',
    fontSize: 16,
  },
  settingControl: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
});

export default TVSettings; 
import React, {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Switch,
  ScrollView,
  Alert,
  Animated,
  Platform,
  BackHandler,
  PressableStateCallbackType,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingItemProps {
  label: string;
  description?: string;
  value?: boolean;
  onPress?: () => void;
  onValueChange?: (value: boolean) => void;
  hasFocus?: boolean;
  isLoading?: boolean;
}

// Add type safety for settings
interface TVSetting {
  label: string;
  description: string;
  value?: boolean;
  onPress?: () => void;
  onValueChange?: (value: boolean) => void;
}

const SettingItem: React.FC<SettingItemProps> = ({
  label,
  description,
  value,
  onPress,
  onValueChange,
  hasFocus,
  isLoading,
}) => {
  const [focusAnim] = React.useState(new Animated.Value(0));

  useEffect(() => {
    if (hasFocus) {
      // Scroll into view when focused
      requestAnimationFrame(() => {
        const element = document.querySelector(`[data-setting="${label}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    Animated.timing(focusAnim, {
      toValue: hasFocus ? 1 : 0,
      duration: 200,
      useNativeDriver: Platform.OS === 'android', // Enable native driver where supported
    }).start();
  }, [hasFocus, focusAnim, label]);

  const animatedStyle = {
    transform: [{scale: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 1.02]
    })}],
    borderColor: focusAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['#1a1a1a', '#81b0ff']
    })
  };

  return (
    <Animated.View 
      style={[styles.settingItem, animatedStyle]}
      data-setting={label}
      testID={label}>
      <Pressable
        onPress={onPress}
        testID={`${label}-pressable`}
        style={({pressed}) => [
          styles.settingContent,
          pressed && styles.pressed
        ]}>
        <View style={styles.labelContainer}>
          <Text style={[styles.settingLabel, hasFocus && styles.focusedText]}>
            {label}
          </Text>
          {description && (
            <Text style={styles.settingDescription}>{description}</Text>
          )}
        </View>
        {onValueChange && (
          <Switch
            testID={`${label}-switch`}
            value={value}
            onValueChange={onValueChange}
            trackColor={{false: '#767577', true: '#81b0ff'}}
            thumbColor={value ? '#f5dd4b' : '#f4f3f4'}
            disabled={isLoading}
          />
        )}
      </Pressable>
    </Animated.View>
  );
};

const TVSettings: React.FC = () => {
  const [autoPlay, setAutoPlay] = useState(true);
  const [showThumbnails, setShowThumbnails] = useState(true);
  const [highQuality, setHighQuality] = useState(true);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [audioDescriptions, setAudioDescriptions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save settings with error handling and retry
  const saveSettings = useCallback(async (retryCount = 3) => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const settings = {
        autoPlay,
        showThumbnails,
        highQuality,
        subtitlesEnabled,
        audioDescriptions,
        lastUpdated: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem('tv_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
      if (retryCount > 0) {
        setTimeout(() => saveSettings(retryCount - 1), 1000);
      } else {
        setError('Failed to save settings. Please try again.');
        Alert.alert(
          'Error',
          'Failed to save settings. Please try again.',
          [{text: 'OK'}]
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [autoPlay, showThumbnails, highQuality, subtitlesEnabled, audioDescriptions]);

  // Load settings with validation
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const savedSettings = await AsyncStorage.getItem('tv_settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          
          // Validate settings
          if (typeof settings !== 'object') throw new Error('Invalid settings format');
          
          // Apply settings with type checking
          setAutoPlay(Boolean(settings.autoPlay));
          setShowThumbnails(Boolean(settings.showThumbnails));
          setHighQuality(Boolean(settings.highQuality));
          setSubtitlesEnabled(Boolean(settings.subtitlesEnabled));
          setAudioDescriptions(Boolean(settings.audioDescriptions));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        setError('Failed to load settings');
        Alert.alert(
          'Error',
          'Failed to load settings. Default settings will be used.',
          [{text: 'OK'}]
        );
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  // Debounced save settings
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveSettings();
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [autoPlay, showThumbnails, highQuality, subtitlesEnabled, audioDescriptions, saveSettings]);

  const clearWatchHistory = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await AsyncStorage.removeItem('watch_history');
      Alert.alert(
        'Success',
        'Watch history has been cleared',
        [{text: 'OK'}]
      );
    } catch (error) {
      console.error('Failed to clear watch history:', error);
      setError('Failed to clear watch history');
      Alert.alert(
        'Error',
        'Failed to clear watch history. Please try again.',
        [{text: 'OK'}]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const settings: TVSetting[] = [
    {
      label: 'Auto Play Next Episode',
      description: 'Automatically play the next episode when current one ends',
      value: autoPlay,
      onValueChange: setAutoPlay,
    },
    {
      label: 'Show Thumbnails',
      description: 'Display preview thumbnails while seeking',
      value: showThumbnails,
      onValueChange: setShowThumbnails,
    },
    {
      label: 'High Quality Playback',
      description: 'Stream videos in highest quality available',
      value: highQuality,
      onValueChange: setHighQuality,
    },
    {
      label: 'Subtitles',
      description: 'Enable closed captions and subtitles',
      value: subtitlesEnabled,
      onValueChange: setSubtitlesEnabled,
    },
    {
      label: 'Audio Descriptions',
      description: 'Enable audio descriptions for visual content',
      value: audioDescriptions,
      onValueChange: setAudioDescriptions,
    },
    {
      label: 'Clear Watch History',
      description: 'Remove all watched videos from history',
      onPress: clearWatchHistory,
    },
  ];

  // Handle TV remote navigation
  useEffect(() => {
    if (!Platform.isTV) return;

    const handleKeyDown = (event: { keyCode: number }) => {
      switch (event.keyCode) {
        case 19: // Up
        case 20: // Down
          setFocusedIndex(prev => 
            event.keyCode === 19 
              ? Math.max(0, prev - 1)
              : Math.min(settings.length - 1, prev + 1)
          );
          return true;
        case 23: // Center/Enter
          const setting = settings[focusedIndex];
          if (setting.onPress) {
            setting.onPress();
          } else if (setting.onValueChange) {
            setting.onValueChange(!setting.value);
          }
          return true;
        case 4: // Back
          BackHandler.exitApp();
          return true;
        default:
          return false;
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => true);

    return () => {
      backHandler.remove();
    };
  }, [focusedIndex, settings]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable
          onPress={() => window.location.reload()}
          style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      testID="tv-settings-scroll">
      <Text style={styles.title} testID="tv-settings-title">TV Settings</Text>
      {isLoading && (
        <Text style={styles.loadingText} testID="loading-indicator">Loading...</Text>
      )}
      <View style={styles.settingsContainer} testID="settings-container">
        {settings.map((setting, index) => (
          <SettingItem
            key={setting.label}
            {...setting}
            hasFocus={index === focusedIndex}
            isLoading={isLoading}
          />
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
  },
  title: {
    fontSize: 32,
    color: '#fff',
    marginVertical: 20,
    marginHorizontal: 30,
    fontWeight: 'bold',
  },
  settingsContainer: {
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  settingItem: {
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#1a1a1a',
    overflow: 'hidden',
  },
  settingContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  pressed: {
    opacity: 0.8,
  },
  labelContainer: {
    flex: 1,
    marginRight: 20,
  },
  settingLabel: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 4,
  },
  focusedText: {
    color: '#81b0ff',
  },
  settingDescription: {
    fontSize: 16,
    color: '#999',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#81b0ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default TVSettings; 
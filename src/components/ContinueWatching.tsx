import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Pressable,
} from 'react-native';
import useWatchHistoryStore from '../lib/zustand/watchHistrory';
import {mainStorage as MMKV} from '../lib/storage/StorageService';
import {useNavigation} from '@react-navigation/native';
import useThemeStore from '../lib/zustand/themeStore';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {TabStackParamList} from '../App';
import AntDesign from '@expo/vector-icons/AntDesign';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {MaterialCommunityIcons} from '@expo/vector-icons';

const ContinueWatching = () => {
  const {primary} = useThemeStore(state => state);
  const navigation =
    useNavigation<NativeStackNavigationProp<TabStackParamList>>();
  const {history, removeItem} = useWatchHistoryStore(state => state);
  const [progressData, setProgressData] = useState<Record<string, number>>({});
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState<boolean>(false);

  // Filter out duplicates and get the most recent items
  const recentItems = React.useMemo(() => {
    const seen = new Set();
    const items = history
      .filter(item => {
        if (seen.has(item.link)) {
          return false;
        }
        seen.add(item.link);
        return true;
      })
      .slice(0, 10); // Limit to 10 items

    return items;
  }, [history]);

  // Load progress data
  useEffect(() => {
    const loadProgressData = () => {
      const progressMap: Record<string, number> = {};

      recentItems.forEach(item => {
        try {
          // Try to get dedicated watch history progress
          const historyKey = item.link;
          const historyProgressKey = `watch_history_progress_${historyKey}`;
          const storedProgress = MMKV.getString(historyProgressKey);

          if (storedProgress) {
            const parsed = JSON.parse(storedProgress);
            if (parsed.percentage) {
              progressMap[item.link] = Math.min(
                Math.max(parsed.percentage, 0),
                100,
              );
            } else if (parsed.currentTime && parsed.duration) {
              const percentage = (parsed.currentTime / parsed.duration) * 100;
              progressMap[item.link] = Math.min(Math.max(percentage, 0), 100);
            }
          } else if (item.currentTime && item.duration) {
            const percentage = (item.currentTime / item.duration) * 100;
            progressMap[item.link] = Math.min(Math.max(percentage, 0), 100);
          }
        } catch (e) {
          console.error('Error processing progress for item:', item.title, e);
        }
      });

      setProgressData(progressMap);
    };

    loadProgressData();
  }, [recentItems]);

  const handleNavigateToInfo = (item: any) => {
    try {
      // Parse the link if it's a JSON string
      let linkData = item.link;
      if (typeof item.link === 'string' && item.link.startsWith('{')) {
        try {
          linkData = JSON.parse(item.link);
        } catch (e) {
          console.error('Failed to parse link:', e);
        }
      }
      console.log('linkData', item.poster);
      // Navigate to Info screen
      navigation.navigate('HomeStack', {
        screen: 'Info',
        params: {
          link: linkData,
          provider: item.provider,
          poster: item.poster,
        },
      } as any);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const toggleItemSelection = (link: string) => {
    setSelectedItems(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(link)) {
        newSelected.delete(link);
      } else {
        newSelected.add(link);
      }

      // Exit selection mode if no items are selected
      if (newSelected.size === 0) {
        setSelectionMode(false);
      }

      return newSelected;
    });
  };

  const handleLongPress = (link: string) => {
    ReactNativeHapticFeedback.trigger('effectClick', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });

    // Enter selection mode if not already in it
    if (!selectionMode) {
      setSelectionMode(true);
    }

    toggleItemSelection(link);
  };

  const handlePress = (item: any) => {
    if (selectionMode) {
      toggleItemSelection(item.link);
    } else {
      handleNavigateToInfo(item);
    }
  };

  const deleteSelectedItems = () => {
    recentItems.forEach(item => {
      if (selectedItems.has(item.link)) {
        removeItem(item);
      }
    });
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  const exitSelectionMode = () => {
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  // Only render if we have items (MOVED AFTER ALL HOOKS)
  if (recentItems.length === 0) {
    return null;
  }

  return (
    <Pressable
      onPress={() => selectionMode && exitSelectionMode()}
      className="mt-3 mb-8">
      <View className="flex flex-row justify-between items-center px-2 mb-3">
        <Text className="text-2xl font-semibold" style={{color: primary}}>
          Continue Watching
        </Text>

        {selectionMode && selectedItems.size > 0 && (
          <View className="flex flex-row items-center">
            <Text className="text-white mr-1">
              {selectedItems.size} selected
            </Text>
            <TouchableOpacity
              onPress={deleteSelectedItems}
              className=" rounded-full mr-2">
              <MaterialCommunityIcons
                name="delete-outline"
                size={25}
                color={primary}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={recentItems}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={item => item.link}
        contentContainerStyle={{paddingHorizontal: 12}}
        renderItem={({item}) => {
          const progress = progressData[item.link] || 0;
          const isSelected = selectedItems.has(item.link);

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              className="max-w-[100px] mx-2"
              onLongPress={e => {
                e.stopPropagation();
                handleLongPress(item.link);
              }}
              onPress={e => {
                e.stopPropagation();
                handlePress(item);
              }}>
              <View className="relative">
                {/* Poster Image */}
                <Image
                  source={{uri: item?.poster}}
                  className="rounded-md"
                  style={{width: 100, height: 150}}
                />

                {/* Selection Indicator */}
                {selectionMode && (
                  <View className="absolute top-2 right-2 z-50">
                    <View
                      className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        isSelected ? '' : 'bg-white/30'
                      }`}
                      style={{
                        borderWidth: 1,
                        borderColor: 'white',
                        backgroundColor: isSelected ? primary : undefined,
                      }}>
                      {isSelected && (
                        <AntDesign name="check" size={12} color="white" />
                      )}
                    </View>
                  </View>
                )}

                {/* Selection Overlay */}
                {isSelected && (
                  <View className="absolute top-0 left-0 right-0 bottom-0 bg-black/30 rounded-lg" />
                )}

                {/* Progress Bar */}
                <View
                  className="absolute bottom-0 left-0 right-0 h-1"
                  style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                  <View
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      height: '100%',
                      width: `${progress}%`,
                      backgroundColor: primary,
                    }}
                  />
                </View>
              </View>
              <Text
                className="text-white text-center truncate w-24 text-xs"
                numberOfLines={2}>
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </Pressable>
  );
};

export default ContinueWatching;

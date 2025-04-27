import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  Platform,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import useWatchHistoryStore from '../lib/zustand/watchHistrory';
import {FlashList} from '@shopify/flash-list';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {WatchHistoryStackParamList} from '../App';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import useThemeStore from '../lib/zustand/themeStore';
import {mainStorage} from '../lib/storage';

type Props = NativeStackScreenProps<WatchHistoryStackParamList, 'WatchHistory'>;
const WatchHistory = ({navigation}: Props) => {
  const {primary} = useThemeStore(state => state);
  const {history, clearHistory} = useWatchHistoryStore(state => state);
  const [progressData, setProgressData] = useState<Record<string, number>>({});

  // Filter out duplicates by link, keeping only the most recent entry
  const uniqueHistory = React.useMemo(() => {
    const seen = new Set();
    return history.filter(item => {
      if (seen.has(item.link)) {
        return false;
      }
      seen.add(item.link);
      return true;
    });
  }, [history]);
  // Load all progress data when component mounts
  useEffect(() => {
    const loadProgressData = () => {
      const progressMap: Record<string, number> = {};
      uniqueHistory.forEach(item => {
        try {
          // First try to get the dedicated watch history progress
          // Use the infoUrl or link as the key, matching Player.tsx
          const historyKey = item.link;
          const historyProgressKey = `watch_history_progress_${historyKey}`;
          const storedProgress = mainStorage.getString(historyProgressKey);
          // Log what we're looking for and what we found
          console.log(
            `Looking for progress: ${historyProgressKey}`,
            storedProgress ? 'FOUND' : 'NOT FOUND',
          );

          if (storedProgress) {
            const parsed = JSON.parse(storedProgress);
            console.log(`Progress data for ${item.title}:`, {
              percentage: parsed.percentage?.toFixed(1) + '%',
              currentTime: parsed.currentTime?.toFixed(1),
              duration: parsed.duration?.toFixed(1),
              updatedAt: new Date(parsed.updatedAt).toLocaleTimeString(),
            });
            if (parsed.percentage) {
              progressMap[item.link] = Math.min(
                Math.max(parsed.percentage, 0),
                100,
              );
              return;
            } else if (parsed.currentTime && parsed.duration) {
              const percentage = (parsed.currentTime / parsed.duration) * 100;
              progressMap[item.link] = Math.min(Math.max(percentage, 0), 100);
              return;
            }
          }
          // Try episode-specific key if this item has an episodeTitle
          if (item.episodeTitle) {
            const episodeKey = `watch_history_progress_${historyKey}_${item.episodeTitle.replace(
              /\s+/g,
              '_',
            )}`;
            const episodeData = mainStorage.getString(episodeKey);
            if (episodeData) {
              const parsed = JSON.parse(episodeData);
              if (parsed.percentage) {
                progressMap[item.link] = Math.min(
                  Math.max(parsed.percentage, 0),
                  100,
                );
                return;
              }
            }
          }

          // Fall back to standard video position cache
          const cachedProgress = mainStorage.getString(item.link);
          if (cachedProgress) {
            const parsed = JSON.parse(cachedProgress);
            if (parsed.position && parsed.duration) {
              const percentage = (parsed.position / parsed.duration) * 100;
              progressMap[item.link] = Math.min(Math.max(percentage, 0), 100);
              return;
            }
          }

          // Use the progress from history item itself as last resort
          if (item.currentTime && item.duration) {
            const percentage = (item.currentTime / item.duration) * 100;
            progressMap[item.link] = Math.min(Math.max(percentage, 0), 100);
            return;
          }
        } catch (e) {
          console.error('Error processing progress for item:', item.title, e);
        }
      });
      console.log('Final progress data loaded:', progressMap);
      setProgressData(progressMap);
    };

    loadProgressData();
  }, [uniqueHistory]);

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

      // Simple direct navigation to Info screen
      navigation.navigate('Info', {
        link: linkData,
        provider: item.provider || 'multiStream',
        poster: item.image || '',
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="light-content"
      />

      <View
        className="w-full bg-black"
        style={{
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        }}
      />

      <View className="flex-row justify-between items-center p-4">
        <Text className="text-white text-2xl font-bold">Watch History</Text>
        {uniqueHistory.length > 0 && (
          <TouchableOpacity
            onPress={() => clearHistory()}
            className="bg-white/10 px-3 py-1 rounded-full">
            <Text className="text-white">Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlashList
        data={uniqueHistory}
        estimatedItemSize={150}
        numColumns={3}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center mt-10">
            <MaterialCommunityIcons name="history" size={80} color={primary} />
            <Text className="text-white/70 text-base mt-4">
              No watch history
            </Text>
          </View>
        )}
        renderItem={({item}) => {
          // Get the progress for this item
          const progress = progressData[item.link] || 0;

          return (
            <View className="flex-1 m-1">
              <TouchableOpacity
                onPress={() => handleNavigateToInfo(item)}
                activeOpacity={0.8}>
                <View className="relative overflow-hidden">
                  <Image
                    source={{uri: item.image}}
                    className="w-full aspect-[2/3] rounded-lg"
                  />

                  {/* Enhanced Progress Bar */}
                  <View
                    className="absolute bottom-0 left-0 right-0 h-2"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      zIndex: 10,
                    }}>
                    {/* Progress bar fill with gradient effect */}
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: `${progress}%`,
                        backgroundColor: primary,
                        zIndex: 20,
                        shadowColor: primary,
                        shadowOffset: {width: 0, height: 0},
                        shadowOpacity: 0.5,
                        shadowRadius: 3,
                        elevation: 5,
                      }}
                    />
                  </View>

                  {/* Overlay gradient for better text readability */}
                  {progress > 0 && (
                    <View
                      className="absolute bottom-0 left-0 right-0 h-16"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        zIndex: 10,
                      }}
                    />
                  )}
                  {/* IMPROVED percentage indicator with more visible fill */}
                  {progress > 0 && progress < 100 && (
                    <View
                      className="absolute bottom-3 right-2"
                      style={{
                        zIndex: 15,
                      }}>
                      {/* Container with fixed width for consistent size */}
                      <View
                        style={{
                          width: 45, // Fixed width for consistent sizing
                          height: 18, // Fixed height
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          borderRadius: 9,
                          overflow: 'hidden',
                          borderLeftWidth: 2,
                          borderLeftColor: primary,
                          flexDirection: 'row', // For horizontal layout
                          alignItems: 'center', // Center text vertically
                        }}>
                        {/* More visible fill with primary color */}
                        <View
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: `${progress}%`,
                            backgroundColor: `${primary}CC`, // More opaque primary color (80%)
                          }}
                        />

                        {/* Percentage text always centered */}
                        <Text
                          className="text-white text-[10px] font-medium w-full text-center"
                          style={{
                            textShadowColor: 'rgba(0,0,0,0.9)',
                            textShadowRadius: 3,
                            textShadowOffset: {width: 0, height: 0},
                            zIndex: 20, // Ensure text is on top
                          }}>
                          {Math.round(progress)}%
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Checkmark overlay when progress is 100% */}
                  {progress >= 100 && (
                    <View
                      className="absolute top-2 right-2 p-1 rounded-full"
                      style={{
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        borderWidth: 1.5,
                        borderColor: primary,
                        zIndex: 15,
                      }}>
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={18}
                        color={primary}
                      />
                    </View>
                  )}
                </View>

                <Text numberOfLines={2} className="text-white text-sm mt-1">
                  {item.title}
                </Text>
                {item.episodeTitle && (
                  <Text numberOfLines={1} className="text-white/60 text-xs">
                    {item.episodeTitle}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
      />
    </View>
  );
};

export default WatchHistory;

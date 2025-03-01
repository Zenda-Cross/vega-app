import {View, Text, ScrollView, StatusBar, Platform, Image} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {WatchListStackParamList} from '../App';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {TouchableOpacity} from 'react-native';
import useThemeStore from '../lib/zustand/themeStore';
import useWatchListStore from '../lib/zustand/watchListStore';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {MotiView} from 'moti';
import useContentStore from '../lib/zustand/contentStore';
import {manifest} from '../lib/Manifest';

const Library = () => {
  const {primary} = useThemeStore(state => state);
  const navigation =
    useNavigation<NativeStackNavigationProp<WatchListStackParamList>>();
  const {watchList} = useWatchListStore(state => state);
  const {provider} = useContentStore(state => state);
  const [suggestions, setSuggestions] = useState<any[]>([]);

  useEffect(() => {
    if (watchList.length === 0) {
      // Get random items from trending/popular section
      const trendingItems = (manifest[provider.value]?.catalog || [])
        .find(cat => cat.title.toLowerCase().includes('trend') || cat.title.toLowerCase().includes('popular'))
        ?.Posts || [];
      
      // Get 4 random items
      const randomSuggestions = trendingItems
        .sort(() => 0.5 - Math.random())
        .slice(0, 4);
      
      setSuggestions(randomSuggestions);
    }
  }, [watchList.length, provider]);

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
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 
        }} 
      />

      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-white text-2xl font-bold mb-6 mt-4">Watchlist</Text>

        {watchList.length > 0 ? (
          <View className="flex-row flex-wrap gap-3">
            {watchList.map((item: any, index: number) => (
              <TouchableOpacity
                key={item.link + index}
                onPress={() =>
                  navigation.navigate('Info', {
                    link: item.link,
                    provider: item.provider,
                    poster: item.poster,
                  })
                }
                className="mb-4"
              >
                <View className="relative">
                  <Image
                    className="rounded-xl"
                    source={{uri: item.poster}}
                    style={{width: 110, height: 165}}
                  />
                  <View className="absolute bottom-0 w-full bg-black/60 rounded-b-xl px-2 py-1">
                    <Text className="text-white text-xs" numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View className="flex-1">
            <View className="items-center justify-center mt-20 mb-12">
              <MaterialCommunityIcons 
                name="playlist-remove" 
                size={80} 
                color={primary} 
              />
              <Text className="text-white/70 text-base mt-4 text-center">
                Your watchlist is empty
              </Text>
              <Text className="text-white/50 text-sm mt-2 text-center">
                Add shows and movies to keep track of what you want to watch
              </Text>
            </View>

            {suggestions.length > 0 && (
              <View className="mt-8">
                <Text className="text-white/70 text-lg font-medium mb-4">
                  Recommended for you
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {suggestions.map((item, index) => (
                    <MotiView
                      key={item.link + index}
                      from={{ opacity: 0, translateY: 20 }}
                      animate={{ opacity: 1, translateY: 0 }}
                      transition={{
                        type: 'timing',
                        duration: 500,
                        delay: index * 100
                      }}
                    >
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate('Info', {
                            link: item.link,
                            provider: provider.value,
                            poster: item.image,
                          })
                        }
                        className="mb-4"
                      >
                        <View className="relative">
                          <Image
                            className="rounded-xl"
                            source={{uri: item.image}}
                            style={{width: 110, height: 165}}
                          />
                          <View className="absolute bottom-0 w-full bg-black/60 rounded-b-xl px-2 py-1">
                            <Text className="text-white text-xs" numberOfLines={1}>
                              {item.title}
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </MotiView>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Library;

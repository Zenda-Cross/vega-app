import {
  View,
  Text,
  ScrollView,
  StatusBar,
  Platform,
  Image,
  Dimensions,
} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {WatchListStackParamList} from '../App';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {TouchableOpacity} from 'react-native';
import useThemeStore from '../lib/zustand/themeStore';
import useWatchListStore from '../lib/zustand/watchListStore';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const Library = () => {
  const {primary} = useThemeStore(state => state);
  const navigation =
    useNavigation<NativeStackNavigationProp<WatchListStackParamList>>();
  const {watchList} = useWatchListStore(state => state);

  const screenWidth = Dimensions.get('window').width;
  const padding = 32; // 16 padding on each side (px-4 = 16)
  const spacing = 12; // gap-3 = 12px
  const numberOfTiles = 3;
  const tileWidth =
    (screenWidth - padding - spacing * (numberOfTiles - 1)) / numberOfTiles;
  const tileHeight = tileWidth * 1.5; // maintain 1.5:1 aspect ratio

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

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        <Text className="text-white text-2xl font-bold mb-6 mt-4">
          Watchlist
        </Text>

        {watchList.length > 0 ? (
          <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: spacing}}>
            {watchList.map((item, index: number) => (
              <TouchableOpacity
                key={item.link + index}
                onPress={() =>
                  navigation.navigate('Info', {
                    link: item.link,
                    provider: item.provider,
                    poster: item.poster,
                  })
                }
                className="mb-4">
                <View className="relative overflow-hidden">
                  <Image
                    className="rounded-xl max-w-[100px] max-h-[150px]"
                    resizeMode="cover"
                    source={{uri: item.poster}}
                    style={{
                      width: tileWidth,
                      height: tileHeight,
                    }}
                  />
                  <Text
                    className="text-white text-xs truncate text-center mt-1 max-w-[100px]"
                    style={{width: tileWidth - 10}}
                    numberOfLines={1}>
                    {item.title}
                  </Text>
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
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Library;

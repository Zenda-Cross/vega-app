import {View, Text, ScrollView, StatusBar, Platform, Image} from 'react-native';
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

  return (
    <View className="flex-1 bg-black justify-center items-center">
      <StatusBar translucent backgroundColor="transparent" />

      <View
        className="w-full bg-black"
        style={{
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        }}
      />

      <ScrollView
        className="px-3"
        contentContainerStyle={{}}
        showsVerticalScrollIndicator={false}>
        <Text
          className="text-2xl text-center font-bold mb-6 mt-4"
          style={{color: primary}}>
          Watchlist
        </Text>

        {watchList.length > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              paddingBottom: 50,
            }}>
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
                    style={{
                      width: 100,
                      height: 150,
                      borderRadius: 10,
                    }}
                    source={{uri: item.poster}}
                  />
                  <Text
                    className="text-white text-xs truncate text-center mt-1 max-w-[100px]"
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
                Your WatchList is empty
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default Library;

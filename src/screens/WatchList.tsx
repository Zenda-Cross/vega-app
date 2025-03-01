import {View, Text, ScrollView} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {WatchListStackParamList} from '../App';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Image} from 'react-native';
import {TouchableOpacity} from 'react-native';
import useThemeStore from '../lib/zustand/themeStore';
import useWatchListStore from '../lib/zustand/watchListStore';
import LinearGradient from 'react-native-linear-gradient';
import {MotiView} from 'moti';
import {Feather} from '@expo/vector-icons';

const Library = () => {
  const {primary} = useThemeStore(state => state);
  const navigation =
    useNavigation<NativeStackNavigationProp<WatchListStackParamList>>();
  const {watchList} = useWatchListStore(state => state);
  
  return (
    <View className="h-full w-full">
      <LinearGradient
        colors={['#000000', '#1a1a1a', '#000000']}
        className="h-full w-full">
        <ScrollView
          className="h-full w-full p-2 pt-8"
          contentContainerStyle={{alignItems: 'center'}}>
          <View className="w-full px-4 py-6">
            <Text 
              className="text-3xl font-bold text-center mb-2" 
              style={{color: primary}}>
              Watch List
            </Text>
            <Text className="text-gray-400 text-center text-sm">
              Your saved movies and shows
            </Text>
          </View>

          <View className="w-[400px] flex-row justify-center">
            <View className="flex-row flex-wrap gap-4 mb-5 w-[340px]">
              {watchList.map((item: any, index: number) => (
                <MotiView
                  from={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 100 }}
                  key={item.link + index}
                  className="flex flex-col">
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('Info', {
                        link: item.link,
                        provider: item.provider,
                        poster: item.poster,
                      })
                    }
                    className="shadow-lg shadow-black">
                    <Image
                      className="rounded-lg"
                      source={{uri: item.poster}}
                      style={{width: 110, height: 165}}
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.9)']}
                      className="absolute bottom-0 w-full h-1/3 rounded-b-lg"
                    />
                  </TouchableOpacity>
                  <Text className="text-white text-center truncate w-28 text-sm mt-2">
                    {item?.title?.length > 20
                      ? item.title.slice(0, 20) + '...'
                      : item.title}
                  </Text>
                </MotiView>
              ))}
            </View>
          </View>

          {watchList.length === 0 && (
            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="items-center justify-center mt-20">
              <Feather name="bookmark" size={64} color="gray" />
              <Text className="text-gray-400 text-center mt-4 text-lg">
                Your watch list is empty
              </Text>
              <Text className="text-gray-600 text-center mt-2">
                Save movies and shows to watch later
              </Text>
            </MotiView>
          )}
          <View className="h-16" />
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default Library;

import {View, Text, ScrollView} from 'react-native';
import React, {useState} from 'react';
import {MMKV} from '../lib/Mmkv';
import {useNavigation} from '@react-navigation/native';
import {WatchListStackParamList} from '../App';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Image} from 'react-native';
import {TouchableOpacity} from 'react-native';

const Library = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<WatchListStackParamList>>();
  const [library, setLibrary] = useState(MMKV.getArray('watchlist') || []);

  return (
    <ScrollView
      className="h-full w-full bg-black p-2"
      contentContainerStyle={{alignItems: 'center', justifyContent: 'center'}}>
      <Text className="text-primary text-2xl font-semibold mt-7">
        Watch List
      </Text>
      <View className="w-[400px] flex-row justify-center">
        <View className="flex-row flex-wrap gap-3 mt-3 w-[340px]">
          {library.map((item: any, index: number) => {
            return (
              <View className="flex flex-col m-" key={item.link + index}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('Info', {
                      link: item.link,
                      provider: item.provider,
                      poster: item.poster,
                    })
                  }>
                  <Image
                    className="rounded-md"
                    source={{uri: item.poster}}
                    style={{width: 100, height: 150}}
                  />
                </TouchableOpacity>
                <Text className="text-white text-center truncate w-24 text-xs">
                  {item?.title?.length > 24
                    ? item.title.slice(0, 24) + '...'
                    : item.title}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
      {library.length === 0 && (
        <Text className="text-white text-center mt-5">
          No items in Watch List
        </Text>
      )}
    </ScrollView>
  );
};

export default Library;

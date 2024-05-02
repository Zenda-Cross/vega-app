import {View, Text, ScrollView} from 'react-native';
import React, {useState} from 'react';
import {MMKV} from '../App';
import {useNavigation} from '@react-navigation/native';
import {HomeStackParamList} from '../App';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Image} from 'react-native';
import {TouchableOpacity} from 'react-native';

const Library = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [library, setLibrary] = useState(MMKV.getArray('library') || []);
  return (
    <ScrollView className="h-full w-full bg-black p-2">
      <Text className="text-primary text-4xl">Library</Text>
      <View className="flex-row flex-wrap gap-2 mt-3">
        {library.map((item: any, index: number) => (
          <View className="flex flex-col m-3">
            <TouchableOpacity
              onPress={() => navigation.navigate('Info', {link: item.link})}>
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
        ))}
      </View>
    </ScrollView>
  );
};

export default Library;

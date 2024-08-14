import {View, Text, ScrollView} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SearchStackParamList} from '../App';
import Ionicons from '@expo/vector-icons/Ionicons';
import {TextInput} from 'react-native';
import {TouchableOpacity} from 'react-native';
import {manifest} from '../lib/Manifest';
import useContentStore from '../lib/zustand/contentStore';

const Search = () => {
  const {provider} = useContentStore(state => state);
  const navigation =
    useNavigation<NativeStackNavigationProp<SearchStackParamList>>();
  return (
    <View className="h-full w-full bg-black p-4 items-center">
      <View className="flex flex-row gap-1 items-center mt-7">
        <TextInput
          autoFocus={true}
          onSubmitEditing={e => {
            navigation.navigate('SearchResults', {
              filter: 'searchQuery=' + e.nativeEvent.text,
            });
          }}
          placeholderTextColor={'white'}
          placeholder="Search..."
          className="bg-gray-800 p-2 rounded-md w-[90%] placeholder-white text-white"
        />
        <Ionicons name="search" size={25} color="white" />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: 5,
        }}
        className="w-full h-full mt-4 ">
        {manifest[provider.value].genres.map((genre, index) => (
          <TouchableOpacity
            key={genre.filter}
            onPress={() => {
              navigation.navigate('ScrollList', {
                filter: genre.filter,
                title: genre.title,
              });
            }}
            className="h-24 w-40 bg-quaternary rounded-md p-2 mt-2 flex flex-row items-center justify-center">
            <Text className="text-white font-semibold ">{genre.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default Search;

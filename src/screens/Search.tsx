import {View, Text, ScrollView} from 'react-native';
import React from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SearchStackParamList} from '../App';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {TextInput} from 'react-native';
import {genresList} from '../lib/constants';
import {TouchableOpacity} from 'react-native';

const Search = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<SearchStackParamList>>();
  return (
    <View className="h-full w-full bg-black p-4 items-center">
      <View className="flex flex-row gap-1 items-center">
        <TextInput
          autoFocus={true}
          onSubmitEditing={e => {
            navigation.navigate('ScrollList', {
              filter: e.nativeEvent.text,
              title: 'Search Results',
            });
          }}
          placeholder="Search"
          className="bg-gray-800 p-2 rounded-md w-[90%] text-white"
        />
        <Ionicons name="search" size={25} color="white" />
      </View>
      <ScrollView
        contentContainerStyle={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: 5,
        }}
        className="w-full h-full mt-4 ">
        {genresList.map((genre, index) => (
          <TouchableOpacity
            key={genre.filter}
            onPress={() => {
              navigation.navigate('ScrollList', {
                filter: genre.filter,
                title: genre.name,
              });
            }}
            className="h-24 w-44 bg-quaternary rounded-md p-2 mt-2 flex flex-row items-center justify-center">
            <Text className="text-white font-semibold ">{genre.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default Search;

import {View, Text, ScrollView} from 'react-native';
import React, {useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SearchStackParamList} from '../App';
import Ionicons from '@expo/vector-icons/Ionicons';
import {TextInput} from 'react-native';
import {TouchableOpacity} from 'react-native';
import {manifest} from '../lib/Manifest';
import useContentStore from '../lib/zustand/contentStore';
import {MMKV} from '../lib/Mmkv';

const Search = () => {
  const {provider} = useContentStore(state => state);
  const navigation =
    useNavigation<NativeStackNavigationProp<SearchStackParamList>>();
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(
    MMKV.getArray<string>('searchHistory') || [],
  );

  const handleSearch = () => {
    if (searchText.trim()) {
      const prevSearches = MMKV.getArray<string>('searchHistory') || [];
      console.log('prev', prevSearches);
      if (!prevSearches.includes(searchText.trim())) {
        const newSearches: string[] = [searchText.trim(), ...prevSearches];
        if (newSearches.length > 15) {
          newSearches.pop();
        }
        MMKV.setArray('searchHistory', newSearches);
        setSearchHistory(newSearches);
      }
      navigation.navigate('SearchResults', {
        filter: searchText.trim(),
      });
    }
  };

  return (
    <View className="h-full w-full bg-black p-4 items-center">
      <View className="flex flex-row gap-1 items-center mt-7">
        <TextInput
          autoFocus={true}
          onChangeText={setSearchText}
          value={searchText}
          keyboardType="web-search"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
          placeholderTextColor={'white'}
          placeholder="Search..."
          onFocus={() => setIsSearching(true)}
          onBlur={() => setTimeout(() => setIsSearching(false), 100)}
          className="bg-gray-800 p-2 rounded-md w-[90%] placeholder-white text-white"
        />
        <TouchableOpacity onPress={handleSearch}>
          <Ionicons name="search" size={25} color="white" />
        </TouchableOpacity>
      </View>
      {(isSearching || manifest[provider.value].genres.length === 0) && (
        // search history
        <View className="w-full h-[80%] mt-4">
          <ScrollView className="w-full ">
            {searchHistory?.map((search, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  navigation.navigate('SearchResults', {
                    filter: search,
                  });
                }}
                className="w-full bg-quaternary rounded-md p-2 mt-2 flex flex-row items-center justify-between">
                <Text className="text-white font-semibold ">{search}</Text>
                <Ionicons
                  name="close"
                  size={20}
                  color="white"
                  onPress={() => {
                    const newSearches = MMKV.getArray<string>(
                      'searchHistory',
                    ).filter(item => item !== search);
                    MMKV.setArray('searchHistory', newSearches);
                    setSearchHistory(newSearches);
                  }}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
          {searchHistory.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                MMKV.setArray('searchHistory', []);
                setSearchHistory([]);
              }}
              className="w-full bg-quaternary rounded-md p-2 mt-2 flex flex-row items-center justify-center">
              <Ionicons name="trash-sharp" size={18} color="pink" />
              <Text className="text-white font-semibold mt-1">
                Clear History
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: 5,
        }}
        className="w-full h-full mt-4 ">
        {!isSearching &&
          manifest[provider.value].genres.map(genre => (
            <TouchableOpacity
              key={genre.filter}
              onPress={() => {
                navigation.navigate('ScrollList', {
                  filter: genre.filter,
                  title: genre.title,
                  isSearch: false,
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

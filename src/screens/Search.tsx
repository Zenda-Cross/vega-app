import {View, Text, FlatList} from 'react-native';
import React, {useState, useEffect} from 'react';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {SearchStackParamList} from '../App';
import {MaterialIcons, Ionicons, Feather} from '@expo/vector-icons';
import {TextInput} from 'react-native';
import {TouchableOpacity} from 'react-native';
//import {manifest} from '../lib/Manifest';
//import useContentStore from '../lib/zustand/contentStore';
import useThemeStore from '../lib/zustand/themeStore';
import {MMKV} from '../lib/Mmkv';
import {SafeAreaView} from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeIn,
  SlideInRight,
  ZoomIn,
} from 'react-native-reanimated';
import {searchTMDB} from '../services/tmdb';
import debounce from 'lodash/debounce';
import {TMDBResult} from '../types/tmdb';

const Search = () => {
  const {primary} = useThemeStore(state => state);
  const navigation =
    useNavigation<NativeStackNavigationProp<SearchStackParamList>>();
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(
    MMKV.getArray<string>('searchHistory') || [],
  );
  const [searchResults, setSearchResults] = useState<TMDBResult[]>([]);

  const debouncedSearch = debounce(async text => {
    if (text.length >= 2) {
      const results = await searchTMDB(text);
      console.log('Search Results:', results);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, 500);

  useEffect(() => {
    debouncedSearch(searchText);
    return () => debouncedSearch.cancel();
  }, [searchText]);

  const handleSearch = (text: string) => {
    if (text.trim()) {
      // Save to search history
      const prevSearches = MMKV.getArray<string>('searchHistory') || [];
      if (!prevSearches.includes(text.trim())) {
        const newSearches = [text.trim(), ...prevSearches].slice(0, 15);
        MMKV.setArray('searchHistory', newSearches);
        setSearchHistory(newSearches);
      }

      navigation.navigate('SearchResults', {
        filter: text.trim(),
      });
    }
  };

  const removeHistoryItem = (search: string) => {
    const newSearches = searchHistory.filter(item => item !== search);
    MMKV.setArray('searchHistory', newSearches);
    setSearchHistory(newSearches);
  };

  const clearHistory = () => {
    MMKV.setArray('searchHistory', []);
    setSearchHistory([]);
  };

  return (
    <SafeAreaView className="flex-1 bg-black">
      {/* Title Section */}
      <Animated.View
        entering={FadeInDown.delay(100).springify()}
        className="px-4 pt-4">
        <Text className="text-white text-xl font-bold mb-3">Search</Text>
        <View className="flex-row items-center space-x-3 mb-2">
          <View className="flex-1">
            <View className="overflow-hidden rounded-xl bg-[#141414] shadow-lg shadow-black/50">
              <View className="px-3 py-3">
                <View className="flex-row items-center">
                  <Animated.View entering={ZoomIn.delay(200)}>
                    <MaterialIcons
                      name="search"
                      size={24}
                      color={isFocused ? primary : '#666'}
                    />
                  </Animated.View>
                  <TextInput
                    className="flex-1 text-white text-base ml-3"
                    placeholder="Search anime..."
                    placeholderTextColor="#666"
                    value={searchText}
                    onChangeText={setSearchText}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    onSubmitEditing={e => handleSearch(e.nativeEvent.text)}
                    returnKeyType="search"
                  />
                  {searchText.length > 0 && (
                    <Animated.View entering={FadeIn}>
                      <TouchableOpacity
                        onPress={() => setSearchText('')}
                        className="bg-gray-800/50 rounded-full p-2">
                        <Feather name="x" size={18} color="#999" />
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Search History - Moved here and only show when no search results */}
        {searchResults.length === 0 && searchHistory.length > 0 && (
          <Animated.View
            entering={SlideInRight.delay(300).springify()}
            className="mb-3">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-white/90 text-base font-semibold">
                Recent Searches
              </Text>
              <TouchableOpacity
                onPress={clearHistory}
                className="bg-red-500/10 rounded-full px-2 py-0.5">
                <Text className="text-red-500 text-xs">Clear All</Text>
              </TouchableOpacity>
            </View>
            {searchHistory.map((search, index) => (
              <Animated.View
                key={index}
                entering={FadeInDown.delay(400 + index * 100).springify()}>
                <TouchableOpacity
                  onPress={() => handleSearch(search)}
                  className="bg-[#141414] rounded-lg p-3 mb-2 flex-row justify-between items-center border border-white/5">
                  <View className="flex-row items-center space-x-2">
                    <View className="bg-white/10 rounded-full p-1.5">
                      <Ionicons name="time-outline" size={16} color={primary} />
                    </View>
                    <Text className="text-white text-sm">{search}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeHistoryItem(search)}
                    className="bg-white/5 rounded-full p-1.5">
                    <Feather name="x" size={14} color="#999" />
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </Animated.View>
        )}
      </Animated.View>

      {/* Search Results */}
      {searchResults.length > 0 ? (
        <FlatList
          data={searchResults}
          keyExtractor={item => item.id.toString()}
          renderItem={({item}) => (
            <Animated.View entering={FadeInDown.springify()} className="px-4">
              <TouchableOpacity
                className="py-3 border-b border-white/10"
                onPress={() => {
                  const searchTitle = item.title || item.name || '';
                  // Save to search history
                  const prevSearches =
                    MMKV.getArray<string>('searchHistory') || [];
                  if (searchTitle && !prevSearches.includes(searchTitle)) {
                    const newSearches = [searchTitle, ...prevSearches].slice(
                      0,
                      15,
                    );
                    MMKV.setArray('searchHistory', newSearches);
                    setSearchHistory(newSearches);
                  }
                  navigation.navigate('SearchResults', {
                    filter: searchTitle,
                  });
                }}>
                <View className="flex-row items-center">
                  <MaterialIcons
                    name="search"
                    size={20}
                    color="#666"
                    style={{marginRight: 12}}
                  />
                  <View>
                    <Text className="text-white text-base">
                      {item.title || item.name}
                    </Text>
                    <Text className="text-white/50 text-xs">
                      {item.media_type === 'tv' ? 'TV Show' : 'Movie'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          )}
          contentContainerStyle={{paddingTop: 4}}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        // Empty State - Only show when no history and no results
        searchHistory.length === 0 && (
          <Animated.View
            entering={FadeIn.delay(300)}
            className="items-center justify-center flex-1">
            <Animated.View entering={ZoomIn.springify()}>
              <View className="bg-white/5 rounded-full p-6 mb-4">
                <Ionicons name="search" size={32} color={primary} />
              </View>
            </Animated.View>
            <View className="bg-white/5 rounded-full p-6 mb-4">
              <Ionicons name="search" size={32} color={primary} />
            </View>
            <Text className="text-white/70 text-base text-center">
              Search for your favorite anime
            </Text>
            <Text className="text-white/40 text-sm text-center mt-1">
              Your recent searches will appear here
            </Text>
          </Animated.View>
        )
      )}
    </SafeAreaView>
  );
};

export default Search;

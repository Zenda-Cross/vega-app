import {View, Text, TouchableOpacity, Image, StatusBar, Platform} from 'react-native';
import React from 'react';
import useWatchHistoryStore from '../lib/zustand/watchHistrory';
import {FlashList} from '@shopify/flash-list';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../App';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import useThemeStore from '../lib/zustand/themeStore';

const WatchHistory = () => {
  const {primary} = useThemeStore(state => state);
  const {history, clearHistory} = useWatchHistoryStore(state => state);
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Filter out duplicates by link, keeping only the most recent entry
  const uniqueHistory = React.useMemo(() => {
    const seen = new Set();
    return history.filter(item => {
      if (seen.has(item.link)) {
        return false;
      }
      seen.add(item.link);
      return true;
    });
  }, [history]);

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

      <View className="flex-row justify-between items-center p-4">
        <Text className="text-white text-2xl font-bold">Watch History</Text>
        {uniqueHistory.length > 0 && (
          <TouchableOpacity 
            onPress={clearHistory}
            className="bg-quaternary p-2 rounded-lg">
            <MaterialCommunityIcons name="delete" size={24} color={primary} />
          </TouchableOpacity>
        )}
      </View>

      <FlashList
        data={uniqueHistory}  
        estimatedItemSize={150}
        numColumns={3}
        ListEmptyComponent={() => (
          <View className="flex-1 justify-center items-center mt-10">
            <MaterialCommunityIcons name="history" size={80} color={primary} />
            <Text className="text-white/70 text-base mt-4">No watch history</Text>
          </View>
        )}
        renderItem={({item}) => (
          <View className="flex-1 m-1">
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('Info', {
                  link: item.link,
                  provider: item.provider,
                  poster: item.image,
                })
              }>
              <Image
                source={{uri: item.image}}
                className="w-full aspect-[2/3] rounded-lg"
              />
              <Text 
                numberOfLines={2} 
                className="text-white text-sm mt-1">
                {item.title}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default WatchHistory;

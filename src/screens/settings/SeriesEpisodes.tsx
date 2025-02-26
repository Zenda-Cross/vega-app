import React from 'react';
import {View, Text, Image, TouchableOpacity} from 'react-native';
import {FlashList} from '@shopify/flash-list';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import useThemeStore from '../../lib/zustand/themeStore';
import * as FileSystem from 'expo-file-system';
import {RootStackParamList} from '../../App';

export type RootStackParamList = {
  SeriesEpisodes: {
    series: string;
    episodes: Array<{uri: string; size: number}>;
    thumbnails: Record<string, string>;
  };
};

type SeriesEpisodesRouteProp = RouteProp<RootStackParamList, 'SeriesEpisodes'>;
type SeriesEpisodesNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SeriesEpisodes = () => {
  const route = useRoute<SeriesEpisodesRouteProp>();
  const navigation = useNavigation<SeriesEpisodesNavigationProp>();
  const {primary} = useThemeStore(state => state);
  const {series, episodes, thumbnails} = route.params;

  // Function to extract episode number from filename
  const getEpisodeNumber = (filename: string): number => {
    const match = filename.match(/episode[\s-]*(\d+)/i) || 
                 filename.match(/ep[\s-]*(\d+)/i) ||
                 filename.match(/[^\d](\d+)[^\d]/);
    return match ? parseInt(match[1]) : 0;
  };

  // Sort episodes by episode number
  const sortedEpisodes = [...episodes].sort((a, b) => {
    const aFilename = a.uri.split('/').pop() || '';
    const bFilename = b.uri.split('/').pop() || '';
    return getEpisodeNumber(aFilename) - getEpisodeNumber(bFilename);
  });

  return (
    <View className="w-full h-full bg-black">
      {/* Simple Header */}
      <View className="bg-tertiary px-4 pt-14 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="bg-quaternary p-2 rounded-full">
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
           <Text 
            className="text-xl text-white font-bold ml-4 flex-1" 
            numberOfLines={1}
            ellipsizeMode="tail">
            {series.length > 20 ? series.substring(0, 20) + '...' : series}
          </Text>
        </View>
      </View>

      {/* Episodes list */}
      <View className="flex-1 px-4">
        <View className="flex-row items-center justify-between py-4">
          <Text className="text-white text-lg font-bold">Episodes</Text>
          <Text className="text-gray-400">{episodes.length} episodes</Text>
        </View>
        
        <FlashList
          data={sortedEpisodes}
          estimatedItemSize={100}
          renderItem={({item}) => {
            const fileName = item.uri.split('/').pop() || '';
            const episodeNumber = getEpisodeNumber(fileName);

            return (
              <TouchableOpacity
                className="flex-row bg-tertiary rounded-lg overflow-hidden mb-2 h-24"
                onPress={() => {
                  navigation.navigate('Player', {
                    episodeList: [{title: fileName || '', link: item.uri}],
                    linkIndex: 0,
                    type: '',
                    directUrl: item.uri,
                    primaryTitle: fileName,
                    poster: {},
                    providerValue: 'vega',
                  });
                }}>
                <View className="w-32 h-full relative">
                  {thumbnails[item.uri] ? (
                    <Image
                      source={{uri: thumbnails[item.uri]}}
                      className="w-full h-full rounded-t-lg"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full bg-quaternary rounded-t-lg" />
                  )}
                  <View className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded">
                    <Text className="text-white text-xs">EP {episodeNumber}</Text>
                  </View>
                </View>
                <View className="flex-1 p-3 justify-center">
                  <Text className="text-base text-white font-medium mb-1">
                    Episode {episodeNumber}
                  </Text>
                  <Text className="text-sm text-gray-400">
                    {(item.size / (1024 * 1024)).toFixed(1)} MB
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </View>
  );
};

export default SeriesEpisodes;
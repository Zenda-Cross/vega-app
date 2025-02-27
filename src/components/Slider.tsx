import {Image, Pressable, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import type {Post} from '../lib/providers/types';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {HomeStackParamList} from '../App';
import useContentStore from '../lib/zustand/contentStore';
import {FlashList} from '@shopify/flash-list';
import SkeletonLoader from './Skeleton';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import AntDesign from '@expo/vector-icons/AntDesign';
import useWatchHistoryStore from '../lib/zustand/watchHistrory';
import useThemeStore from '../lib/zustand/themeStore';
import {MMKV} from '../lib/Mmkv';

export default function Slider({
  isLoading,
  title,
  posts,
  filter,
  providerValue,
  isSearch = false,
}: {
  isLoading: boolean;
  title: string;
  posts: Post[];
  filter: string;
  providerValue?: string;
  isSearch?: boolean;
}): JSX.Element {
  const {provider} = useContentStore(state => state);
  const {primary} = useThemeStore(state => state);
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [isSelected, setSelected] = React.useState('');
  const {removeItem} = useWatchHistoryStore(state => state);

  return (
    <Pressable onPress={() => setSelected('')} className="gap-3 mb-8">
      <View className="flex flex-row items-center justify-between px-4 mb-2">
        <Text className="text-xl font-medium text-white">
          {title}
        </Text>
        {filter !== 'recent' && (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('ScrollList', {
                title: title,
                filter: filter,
                providerValue: providerValue,
                isSearch: isSearch,
              })
            }>
            <Text className="text-white/70 text-sm">See All</Text>
          </TouchableOpacity>
        )}
      </View>
      {isLoading ? (
        <View className="flex flex-row gap-2 overflow-hidden px-4">
          {Array.from({length: 5}).map((_, index) => (
            <View key={index} className="rounded-md overflow-hidden">
              <SkeletonLoader height={200} width={135} />
            </View>
          ))}
        </View>
      ) : (
        <FlashList
          estimatedItemSize={30}
          showsHorizontalScrollIndicator={false}
          data={posts}
          extraData={isSelected}
          horizontal
          contentContainerStyle={{paddingHorizontal: 16}}
          renderItem={({item}) => (
            <TouchableOpacity
              onLongPress={e => {
                e.stopPropagation();
                if (filter === 'recent') {
                  console.log('long press', filter);
                  if (MMKV.getBool('hapticFeedback') !== false) {
                    ReactNativeHapticFeedback.trigger('effectClick', {
                      enableVibrateFallback: true,
                      ignoreAndroidSystemSettings: false,
                    });
                  }
                  setSelected(item.link);
                }
              }}
              onPress={e => {
                e.stopPropagation();
                setSelected('');
                navigation.navigate('Info', {
                  link: item.link,
                  provider: item.provider || providerValue || provider?.value,
                  poster: item?.image,
                });
              }}
              className="mr-3">
              <Image
                className="rounded-md"
                source={{
                  uri:
                    item?.image ||
                    'https://placehold.jp/24/363636/ffffff/100x150.png?text=vega',
                }}
                style={{width: 135, height: 200}}
              />
              {isSelected === item.link && (
                <View className="absolute top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-50">
                  <AntDesign
                    name="delete"
                    size={24}
                    color="white"
                    onPress={() => {
                      console.log('remove', item);
                      setSelected('');
                      removeItem(item);
                    }}
                  />
                </View>
              )}
            </TouchableOpacity>
          )}
          ListFooterComponent={
            !isLoading && posts.length === 0 ? (
              <View className="flex flex-row w-96 justify-center h-10 items-center">
                <Text className="text-whiter text-center">
                  No content found
                </Text>
              </View>
            ) : null
          }
          keyExtractor={item => item.link}
        />
      )}
    </Pressable>
  );
}

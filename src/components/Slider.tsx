import {Image, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import type {Post} from '../lib/providers/types';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {HomeStackParamList} from '../App';
import {Skeleton} from 'moti/skeleton';
import useContentStore from '../lib/zustand/contentStore';
import {FlashList} from '@shopify/flash-list';
import SkeletonLoader from './Skeleton';

export default function Slider({
  isLoading,
  title,
  posts,
  filter,
  providerValue,
}: {
  isLoading: boolean;
  title: string;
  posts: Post[];
  filter: string;
  providerValue?: string;
}): JSX.Element {
  const {provider} = useContentStore(state => state);
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  return (
    <View className="gap-3 mt-7">
      <View className="flex flex-row items-center justify-between px-2">
        <Text className="text-2xl text-primary font-semibold">{title}</Text>
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('ScrollList', {
              title: title,
              filter: filter,
              providerValue: providerValue,
            })
          }>
          <Text className="text-white text-sm">more</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <View className="flex flex-row gap-2 overflow-hidden">
          {Array.from({length: 5}).map((_, index) => (
            <View
              className="mx-3 gap-0 flex mb-3 justify-center items-center"
              key={index}>
              <SkeletonLoader height={150} width={100} />
              <SkeletonLoader height={12} width={97} />
            </View>
          ))}
        </View>
      ) : (
        <FlashList
          estimatedItemSize={posts.length || 1}
          showsHorizontalScrollIndicator={false}
          data={posts}
          horizontal
          contentContainerStyle={{paddingHorizontal: 3, paddingTop: 7}}
          renderItem={({item}) => (
            <View className="flex flex-col mx-2">
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Info', {
                    link: item.link,
                    provider: providerValue || provider?.value,
                    poster: item?.image,
                  })
                }>
                <Image
                  className="rounded-md"
                  source={{
                    uri:
                      item?.image ||
                      'https://placehold.jp/24/363636/ffffff/100x150.png?text=vega',
                  }}
                  style={{width: 100, height: 150}}
                />
              </TouchableOpacity>
              <Text className="text-white text-center truncate w-24 text-xs">
                {item.title.length > 24
                  ? `${item.title.slice(0, 24)}...`
                  : item.title}
              </Text>
            </View>
          )}
          keyExtractor={item => item.link}
        />
      )}
      {!isLoading && posts.length === 0 && (
        <Text className="text-white text-center">No content found</Text>
      )}
    </View>
  );
}

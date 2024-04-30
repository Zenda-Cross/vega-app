import {FlatList, Image, Text, TouchableOpacity, View} from 'react-native';
import React from 'react';
import type {Post} from '../lib/getPosts';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {HomeStackParamList} from '../App';
import {Skeleton} from 'moti/skeleton';
import {MotiView} from 'moti';

export default function Slider({
  isLoading,
  title,
  posts,
}: {
  isLoading: boolean;
  title: string;
  posts: Post[];
}): JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  return (
    <>
      <MotiView
        animate={{backgroundColor: 'black'}}
        //@ts-ignore
        transition={{type: 'timing', delay: 0}}
        className="gap-3 mt-7">
        <Text className="text-2xl text-primary font-semibold">{title}</Text>
        {isLoading ? (
          <View className="flex flex-row gap-2 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <View className="mx-1 gap-1 flex" key={i}>
                <Skeleton
                  key={i}
                  show={true}
                  colorMode="dark"
                  height={150}
                  width={100}
                />
                <View className="h-2" />
                <Skeleton
                  show={true}
                  colorMode="dark"
                  height={10}
                  width={100}
                />
              </View>
            ))}
          </View>
        ) : (
          <FlatList
            className=""
            showsHorizontalScrollIndicator={false}
            data={posts}
            horizontal
            renderItem={({item}) => (
              <View className="flex flex-col mx-2">
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('Info', {link: item.link})
                  }>
                  <Image
                    className="rounded-md"
                    source={{uri: item.image}}
                    style={{width: 100, height: 150}}
                  />
                </TouchableOpacity>
                <Text className="text-white text-center truncate w-24 text-xs">
                  {item.title.length > 24
                    ? item.title.slice(0, 24) + '...'
                    : item.title}
                </Text>
              </View>
            )}
            keyExtractor={item => item.link}
          />
        )}
      </MotiView>
    </>
  );
}

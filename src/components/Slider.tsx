import {FlatList, Image, Text, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import type {Post} from '../lib/getPosts';
import {getPosts} from '../lib/getPosts';

export default function Slider({
  filter,
  title,
}: {
  filter: string;
  title: string;
}): JSX.Element {
  const [posts, setPosts] = useState<Post[]>([]);
  useEffect(() => {
    const fetchPosts = async () => {
      const data = await getPosts(filter, 1);
      setPosts(data);
    };
    fetchPosts();
  }, []);
  return (
    <View className="gap-3 mt-9">
      <Text className="text-2xl text-primary font-semibold">{title}</Text>
      <FlatList
        className=""
        showsHorizontalScrollIndicator={false}
        data={posts}
        horizontal
        renderItem={({item}) => (
          <View className="flex flex-col mx-2">
            <Image
              className="rounded-md"
              source={{uri: item.image}}
              style={{width: 100, height: 150}}
            />
            <Text className="text-white text-center truncate w-24 text-xs">
              {item.title.length > 24
                ? item.title.slice(0, 24) + '...'
                : item.title}
            </Text>
          </View>
        )}
        keyExtractor={item => item.link}
      />
    </View>
  );
}

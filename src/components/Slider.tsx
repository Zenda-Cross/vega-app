import {FlatList, Image, Text, TouchableOpacity, View} from 'react-native';
import React, {useEffect, useState} from 'react';
import type {Post} from '../lib/getPosts';
import {getPosts} from '../lib/getPosts';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import {HomeStackParamList} from '../App';
import {Skeleton} from 'moti/skeleton';
import {MotiView} from 'moti';

export default function Slider({
  filter,
  title,
}: {
  filter: string;
  title: string;
}): JSX.Element {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      const data = await getPosts(filter, 1);
      setPosts(data);
      setLoading(false);
    };
    fetchPosts();
  }, []);
  return (
    <MotiView
      animate={{backgroundColor: 'black'}}
      //@ts-ignore
      transition={{type: 'timing'}}
      className="gap-3 mt-9">
      <Text className="text-2xl text-primary font-semibold">{title}</Text>
      {!loading ? (
        <Skeleton show={loading} colorMode="light" height={150} width={100} />
      ) : (
        <FlatList
          className=""
          showsHorizontalScrollIndicator={false}
          data={posts}
          horizontal
          renderItem={({item}) => (
            <View className="flex flex-col mx-2">
              <TouchableOpacity
                onPress={() => navigation.navigate('Info', {link: item.link})}>
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
  );
}

import {View, Text, TouchableOpacity, FlatList} from 'react-native';
import React, {useEffect, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../App';
import {getPosts, Post} from '../lib/getPosts';
import {Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {Skeleton} from 'moti/skeleton';
import {MotiView} from 'moti';

type Props = NativeStackScreenProps<HomeStackParamList, 'ScrollList'>;

const ScrollList = ({route}: Props): React.ReactElement => {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const [posts, setPosts] = useState<Post[]>([]);
  const {filter} = route.params;
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEnd, setIsEnd] = useState<boolean>(false);
  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      const newPosts = await getPosts(filter, page);
      console.log(newPosts);
      if (newPosts.length === 0) {
        setIsEnd(true);
        setIsLoading(false);
        return;
      }
      setPosts(prev => [...prev, ...newPosts]);
      setIsLoading(false);
    };
    fetchPosts();
  }, [page]);

  const onEndReached = async () => {
    if (isEnd) return;
    setIsLoading(true);
    setPage(page + 1);
  };

  return (
    <MotiView
      className="h-full w-full bg-black items-center p-4"
      animate={{backgroundColor: 'black'}}
      //@ts-ignore
      transition={{
        type: 'timing',
      }}>
      <View className="w-full px-4 font-semibold mt-2">
        <Text className="text-primary text-2xl font-bold">
          {route.params.title}
        </Text>
      </View>
      <View className="justify-center flex-row w-96 ">
        <FlatList
          ListFooterComponent={
            isLoading ? (
              <View className="flex flex-row gap-2 flex-wrap justify-center items-center">
                {[...Array(6)].map((_, i) => (
                  <View className="mx-3 gap-1 flex" key={i}>
                    <Skeleton
                      key={i}
                      show={true}
                      colorMode="dark"
                      height={150}
                      width={100}
                    />
                    <View className="h-1" />
                    <Skeleton
                      show={true}
                      colorMode="dark"
                      height={10}
                      width={100}
                    />
                  </View>
                ))}
              </View>
            ) : null
          }
          data={posts}
          contentContainerStyle={{
            width: 'auto',
            flexDirection: 'row',
            flexWrap: 'wrap',
            alignItems: 'baseline',
            justifyContent: 'flex-start',
          }}
          keyExtractor={(item, i) => item.title + i}
          renderItem={({item}) => (
            <View className="flex flex-col m-3">
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
          onEndReached={onEndReached}
        />
      </View>
    </MotiView>
  );
};

export default ScrollList;

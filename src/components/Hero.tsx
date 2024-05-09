import axios from 'axios';
import {Image, View} from 'moti';
import React, {useEffect, useState} from 'react';
import {Text} from 'react-native';
import {TouchableOpacity} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../App';

function Hero() {
  const [post, setPost] = useState<any>();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  useEffect(() => {
    const fetchPosts = async () => {
      const data = await axios(
        'https://cinemeta-catalogs.strem.io/top/catalog/movie/top.json',
      );
      const list = data.data.metas?.slice(0, 5);
      setPost(list[Math.floor(Math.random() * list.length)]);
    };
    fetchPosts();
  }, []);

  return (
    <View className="relative">
      <Image
        source={{
          uri:
            post?.background || post?.poster || 'https://via.placeholder.com',
        }}
        className="h-96 w-full"
        style={{resizeMode: 'cover'}}
      />
      <View className="absolute bottom-0 w-full z-20 justify-center gap-3 flex items-center">
        <Image
          source={{uri: post?.logo || 'https://via.placeholder.com'}}
          style={{
            width: 200,
            height: 100,
            resizeMode: 'contain',
          }}
        />
        <Text className="text-white text-lg font-bold">
          {post?.genres?.slice(0, 3).map((genre: string) => '•' + genre)}
        </Text>
        <TouchableOpacity
          className=" bg-gray-200  pb-2 pr-2  rounded-md flex-row gap-2 items-center justify-center"
          onPress={() => {
            navigation.navigate('ScrollList', {
              filter: post?.imdb_id,
              title: '',
            });
          }}>
          <FontAwesome6 name="play" size={20} color="black" />
          <Text className="text-black font-bold text-base">Watch</Text>
        </TouchableOpacity>
      </View>
      <LinearGradient
        colors={['transparent', 'black']}
        className="absolute h-full w-full"
      />
    </View>
  );
}

export default Hero;

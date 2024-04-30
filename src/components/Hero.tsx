import axios from 'axios';
import {Image, View} from 'moti';
import React, {useEffect, useState} from 'react';
import {Text} from 'react-native';
import {TouchableOpacity} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome6 from 'react-native-vector-icons/FontAwesome6';

function Hero() {
  const [post, setPost] = useState<any>();
  useEffect(() => {
    const fetchPosts = async () => {
      const data = await axios(
        'https://cinemeta-catalogs.strem.io/top/catalog/series/top.json',
      );
      const list = data.data.metas;
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
        <TouchableOpacity className=" bg-gray-200  pb-2 pr-2  rounded-md flex-row gap-2 items-center justify-center">
          <FontAwesome6 name="play" size={20} color="black" />
          <Text className="text-black font-bold text-base">Play</Text>
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

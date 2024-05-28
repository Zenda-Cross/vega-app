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
import useContentStore from '../lib/zustand/contentStore';
import useHeroStore from '../lib/zustand/herostore';
import {getInfo} from '../lib/getInfo';
import {Skeleton} from 'moti/skeleton';
import {MmmkvCache} from '../lib/Mmkv';

function Hero() {
  const [post, setPost] = useState<any>();
  const [loading, setLoading] = useState(true);
  const {contentType} = useContentStore(state => state);
  const {hero} = useHeroStore(state => state);
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      if (hero?.link) {
        const CacheInfo = MmmkvCache.getString(hero.link);
        try {
          let info = null;
          if (CacheInfo) {
            info = JSON.parse(CacheInfo);
          } else {
            info = await getInfo(hero.link, contentType);
            MmmkvCache.setString(hero.link, JSON.stringify(info));
          }
          // console.warn('info', info);
          const data = await axios(
            `https://v3-cinemeta.strem.io/meta/${info.type}/${info.imdbId}.json`,
          );
          // console.log('streamiodata', data.data?.meta);
          setPost(data.data?.meta);
        } catch (error) {
          console.log('hero fetch error', error);
        }
        setLoading(false);
      }
      // else {
      //   const data = await axios(
      //     'https://cinemeta-catalogs.strem.io/top/catalog/movie/top.json',
      //   );
      //   const list = data.data.metas?.slice(0, 5);
      //   setPost(list[Math.floor(Math.random() * list.length)]);
      // }
    };
    fetchPosts();
  }, [hero]);

  return (
    <View className="relative">
      <Skeleton show={loading} colorMode="dark">
        <Image
          source={{
            uri:
              post?.background || post?.poster || 'https://via.placeholder.com',
          }}
          className="h-96 w-full"
          style={{resizeMode: 'cover'}}
        />
      </Skeleton>
      {
        <View className="absolute bottom-0 w-full z-20 justify-center gap-3 flex items-center">
          {!loading && (
            <>
              {post?.logo ? (
                <Image
                  onError={() => {
                    setPost((prev: any) => {
                      return {
                        ...prev,
                        logo: '',
                      };
                    });
                  }}
                  source={{uri: post?.logo}}
                  style={{
                    width: 200,
                    height: 100,
                    resizeMode: 'contain',
                  }}
                />
              ) : (
                <Text className="text-white text-2xl font-bold">
                  {post?.name}
                </Text>
              )}
              <Text className="text-white text-lg font-bold text-center">
                {post?.genres
                  ?.slice(0, 3)
                  .map((genre: string) => '  • ' + genre)}
              </Text>
            </>
          )}
          {hero?.link && (
            <TouchableOpacity
              className=" bg-gray-200  pb-2 pr-2  rounded-md flex-row gap-2 items-center justify-center"
              // disabled={contentType === 'indian'}
              onPress={() => {
                navigation.navigate('Info', {
                  link: hero.link,
                });
              }}>
              <FontAwesome6 name="play" size={20} color="black" />
              <Text className="text-black font-bold text-base">Watch</Text>
            </TouchableOpacity>
          )}
        </View>
      }
      <LinearGradient
        colors={['transparent', 'black']}
        className="absolute h-full w-full"
      />
    </View>
  );
}

export default Hero;

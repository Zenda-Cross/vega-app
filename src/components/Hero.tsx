import axios from 'axios';
import {Image, MotiView, View} from 'moti';
import React, {useEffect, useState} from 'react';
import {Keyboard, Pressable, Text, TextInput} from 'react-native';
import {TouchableOpacity} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FontAwesome6 from '@expo/vector-icons/FontAwesome';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {HomeStackParamList, SearchStackParamList} from '../App';
import useContentStore from '../lib/zustand/contentStore';
import useHeroStore from '../lib/zustand/herostore';
import {Skeleton} from 'moti/skeleton';
import {cacheStorage, settingsStorage} from '../lib/storage';
import {manifest} from '../lib/Manifest';
import {Info} from '../lib/providers/types';
import {Feather} from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import {DrawerLayout} from 'react-native-gesture-handler';

function Hero({
  isDrawerOpen,
  drawerRef,
}: {
  isDrawerOpen: boolean;
  drawerRef: React.RefObject<DrawerLayout>;
}) {
  const [post, setPost] = useState<any>();
  const [loading, setLoading] = useState(true);
  const [searchActive, setSearchActive] = useState(false);
  const {provider} = useContentStore(state => state);
  const {hero} = useHeroStore(state => state);
  const [showHamburgerMenu] = useState(settingsStorage.showHamburgerMenu());
  const [isDrawerDisabled] = useState(
    settingsStorage.getBool('disableDrawer') || false,
  );
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const searchNavigation =
    useNavigation<NativeStackNavigationProp<SearchStackParamList>>();

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      if (hero?.link) {
        const CacheInfo = cacheStorage.getString(hero.link);
        try {
          let info: Info;
          if (CacheInfo) {
            info = JSON.parse(CacheInfo);
          } else {
            info = await manifest[provider.value].GetMetaData(
              hero.link,
              provider,
            );
            cacheStorage.setString(hero.link, JSON.stringify(info));
          }
          // console.warn('info', info);
          if (info.imdbId) {
            const data = await axios(
              `https://v3-cinemeta.strem.io/meta/${info.type}/${info.imdbId}.json`,
            );
            // console.log('streamiodata', data.data?.meta);
            setPost(data.data?.meta);
          } else {
            setPost(info);
          }
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

  Keyboard.addListener('keyboardDidHide', () => {
    setSearchActive(false);
  });
  return (
    <View className="relative h-[55vh]">
      <View className="absolute pt-3 w-full top-6 px-3 mt-2 z-30 flex-row justify-between items-center">
        {!searchActive && (
          <View
            className={`${
              showHamburgerMenu && !isDrawerDisabled
                ? 'opacity-100'
                : 'opacity-0'
            }`}>
            <Pressable
              className={`${isDrawerOpen ? 'opacity-0' : 'opacity-100'}`}
              onPress={() => {
                drawerRef.current?.openDrawer();
              }}>
              <Ionicons name="menu-sharp" size={27} color="white" />
            </Pressable>
          </View>
        )}
        {searchActive && (
          <MotiView
            from={{opacity: 0, scale: 0.5}}
            animate={{opacity: 1, scale: 1}}
            //@ts-ignore
            transition={{type: 'timing', duration: 300}}
            className="w-full items-center justify-center">
            <TextInput
              onBlur={() => setSearchActive(false)}
              autoFocus={true}
              onSubmitEditing={e => {
                if (e.nativeEvent.text.startsWith('https://')) {
                  navigation.navigate('Info', {
                    link: e.nativeEvent.text,
                  });
                } else {
                  searchNavigation.navigate('ScrollList', {
                    providerValue: provider.value,
                    filter: e.nativeEvent.text,
                    title: `${provider.name}`,
                    isSearch: true,
                  });
                }
              }}
              placeholder={`Search in ${provider.name}`}
              className="w-[95%] px-4 h-10 rounded-full border-white border"
            />
          </MotiView>
        )}
        {!searchActive && (
          <Pressable className="" onPress={() => setSearchActive(true)}>
            <Feather name="search" size={24} color="white" />
          </Pressable>
        )}
      </View>

      <Skeleton show={loading} colorMode="dark">
        <Image
          source={{
            uri:
              post?.background ||
              post?.image ||
              post?.poster ||
              'https://placehold.jp/24/363636/ffffff/500x500.png?text=Vega',
          }}
          onError={() =>
            setPost((prev: any) => {
              return {
                ...prev,
                background: '',
              };
            })
          }
          className="h-full w-full"
          style={{resizeMode: 'cover'}}
        />
      </Skeleton>
      <View className="absolute bottom-12 w-full z-20 px-6">
        {!loading && (
          <View className="gap-4 items-center">
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
              <Text className="text-white text-center text-2xl font-bold">
                {post?.name || post?.title}
              </Text>
            )}

            <View className="flex-row items-center justify-center space-x-2">
              {post?.genre?.slice(0, 3)?.map((item: string, index: number) => {
                return (
                  <Text
                    key={index}
                    className="text-white text-sm font-semibold">
                    • {item}
                  </Text>
                );
              })}
              {!post?.genre &&
                post?.tags?.slice(0, 3)?.map((item: string, index: number) => {
                  return (
                    <Text
                      key={index}
                      className="text-white text-sm font-semibold">
                      • {item}
                    </Text>
                  );
                })}
            </View>

            <View className="flex-1 items-center justify-center">
              {hero?.link && (
                <TouchableOpacity
                  className="bg-white px-10 py-2 rounded-lg flex-row items-center space-x-2"
                  onPress={() => {
                    navigation.navigate('Info', {
                      link: hero.link,
                      provider: provider.value,
                      poster: post?.image || post?.poster || post?.background,
                    });
                  }}>
                  <FontAwesome6 name="play" size={20} color="black" />
                  <Text className="text-black font-bold text-lg">Play</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)', 'black']}
        locations={[0, 0.7, 1]}
        className="absolute h-full w-full"
      />
      {searchActive && (
        <LinearGradient
          colors={['black', 'transparent']}
          locations={[0, 0.3]}
          className="absolute h-[30%] w-full"
        />
      )}
    </View>
  );
}

export default Hero;

import {
  Image,
  Text,
  View,
  StatusBar,
  RefreshControl,
  FlatList,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../../App';
import type {Info} from '../../lib/providers/types';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import SeasonList from '../../components/SeasonList';
import {Skeleton} from 'moti/skeleton';
import Ionicons from '@expo/vector-icons/Ionicons';
import {MMKV, MmmkvCache} from '../../lib/Mmkv';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import useContentStore from '../../lib/zustand/contentStore';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import {manifest} from '../../lib/Manifest';
import {BlurView} from 'expo-blur';

type Props = NativeStackScreenProps<HomeStackParamList, 'Info'>;
export default function Info({route, navigation}: Props): React.JSX.Element {
  const [info, setInfo] = useState<Info>();
  const [meta, setMeta] = useState<any>();
  const [infoLoading, setInfoLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inLibrary, setInLibrary] = useState(
    MMKV.getArray('watchlist')?.some(
      (item: any) => item.link === route.params.link,
    ),
  );
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  const {provider} = useContentStore(state => state);

  const handleScroll = (event: any) => {
    setBackgroundColor(
      event.nativeEvent.contentOffset.y > 150 ? 'black' : 'transparent',
    );
  };
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        console.log('fetching info', refreshing);
        setMeta([]);
        setInfo(undefined);
        setInfoLoading(true);
        // cache
        await new Promise(resolve => setTimeout(resolve, 200));
        const cacheDataRes = MmmkvCache.getString(route.params.link) || '';
        // console.log('cacheDataRes', cacheDataRes);
        if (cacheDataRes) {
          const cacheData = await JSON.parse(cacheDataRes as string);
          setInfo(cacheData);
          setInfoLoading(false);
          const cacheMetaRes = MmmkvCache.getString(cacheData.imdbId);
          if (cacheMetaRes) {
            const cacheMeta = await JSON.parse(cacheMetaRes as string);
            setMeta(cacheMeta);
          }
          // console.log('cache', cacheData);
        }
        const data = await manifest[
          route.params.provider || provider.value
        ].getInfo(route.params.link, provider);

        if (data.linkList?.length === 0) {
          setInfoLoading(false);
          return;
        }
        try {
          const metaRes = await axios.get(
            `https://v3-cinemeta.strem.io/meta/${data?.type}/${data?.imdbId}.json`,
          );
          if (metaRes?.data?.meta) {
            setMeta(metaRes?.data.meta);
            MmmkvCache.setString(
              data.imdbId,
              JSON.stringify(metaRes.data.meta),
            );
          }
        } catch (e) {
          console.log('meta error', e);
        }
        setInfo(data);
        MmmkvCache.setString(route.params.link, JSON.stringify(data));
        setInfoLoading(false);
        // console.log(info?.linkList);
      } catch (e) {
        console.log('info error', e);
        setInfoLoading(false);
      }
    };
    fetchInfo();
  }, [refreshing, route.params.link]);

  // add to library
  const addLibrary = () => {
    ReactNativeHapticFeedback.trigger('effectClick', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    const library = MMKV.getArray('watchlist') || [];
    library.push({
      title: meta?.name || info?.title,
      poster: meta?.poster || route.params.poster || info?.image,
      link: route.params.link,
      provider: route.params.provider || provider.value,
    });
    MMKV.setArray('watchlist', library);
    setInLibrary(true);
  };

  // remove from library
  const removeLibrary = () => {
    ReactNativeHapticFeedback.trigger('effectClick', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    const library = MMKV.getArray('watchlist') || [];
    const newLibrary = library.filter(
      (item: any) => item.link !== route.params.link,
    );
    MMKV.setArray('watchlist', newLibrary);
    setInLibrary(false);
  };
  return (
    <View className="h-full w-full">
      <StatusBar
        showHideTransition={'slide'}
        animated={true}
        translucent={true}
        backgroundColor={backgroundColor}
      />
      <View>
        <View className="absolute w-full h-[256px]">
          <Skeleton
            show={infoLoading}
            colorMode="dark"
            height={'100%'}
            width={'100%'}>
            {
              <Image
                source={{
                  uri:
                    meta?.background ||
                    info?.image ||
                    'https://placehold.jp/24/363636/ffffff/500x500.png?text=Vega',
                }}
                className=" h-[256] w-full"
              />
            }
          </Skeleton>
        </View>
        {manifest[route.params.provider || provider.value].blurImage && (
          <BlurView
            intensity={100}
            tint="dark"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              height: 256,
              width: '100%',
            }}
          />
        )}
        <FlatList
          data={[]}
          keyExtractor={(_, i) => i.toString()}
          renderItem={() => <View />}
          ListHeaderComponent={
            <>
              <View className="relative w-full h-[256px]">
                <LinearGradient
                  colors={['transparent', 'black']}
                  className="absolute h-full w-full"
                />
                <View className="absolute bottom-0 right-0 w-screen flex-row justify-between items-baseline px-2">
                  {meta?.logo ? (
                    <Image
                      onError={() => setMeta({...meta, logo: undefined})}
                      source={{uri: meta?.logo}}
                      style={{width: 200, height: 100, resizeMode: 'contain'}}
                    />
                  ) : (
                    <Text className="text-white text-2xl mb-3 capitalize font-semibold w-3/4 truncate">
                      {meta?.name || info?.title}
                    </Text>
                  )}
                  {/* rating */}
                  {(meta?.imdbRating || info?.rating) && (
                    <Text className="text-white text-2xl font-semibold">
                      {meta?.imdbRating || info?.rating}
                      <Text className="text-white text-lg">/10</Text>
                    </Text>
                  )}
                </View>
              </View>
              <View className="p-4 bg-black">
                <View className="flex-row gap-x-3 gap-y-1 flex-wrap items-center mb-4">
                  {/* badges */}
                  {meta?.year && (
                    <Text className="text-white text-lg bg-tertiary px-1 rounded-md">
                      {meta?.year}
                    </Text>
                  )}
                  {meta?.runtime && (
                    <Text className="text-white text-lg bg-tertiary px-1 rounded-md">
                      {meta?.runtime}
                    </Text>
                  )}
                  {meta?.genres?.slice(0, 3).map((genre: string) => (
                    <Text
                      key={genre}
                      className="text-white text-lg bg-tertiary px-1 rounded-md">
                      {genre}
                    </Text>
                  ))}
                  {info?.tags?.map((tag: string) => (
                    <Text
                      key={tag}
                      className="text-white text-lg bg-tertiary px-1 rounded-md">
                      {tag}
                    </Text>
                  ))}
                </View>
                {/* Awards */}
                {meta?.awards && (
                  <View className="mb-2 w-full flex-row items-baseline gap-2">
                    <Text className="text-white text- font-semibold">
                      Awards:
                    </Text>
                    <Text className="text-white text-xs bg-tertiary">
                      {meta?.awards?.length > 50
                        ? meta?.awards.slice(0, 50) + '...'
                        : meta?.awards}
                    </Text>
                  </View>
                )}
                {/* cast  */}
                {(meta?.cast?.length! > 0 || info?.cast?.length! > 0) && (
                  <View className="mb-2 w-full flex-row items-start gap-2">
                    <Text className="text-white text-lg font-semibold py-1">
                      Cast
                    </Text>
                    <View className="flex-row gap-1 flex-wrap">
                      {meta?.cast?.slice(0, 3).map((actor: string) => (
                        <Text
                          key={actor}
                          className="text-white text-xs bg-tertiary p-1 rounded-sm">
                          {actor}
                        </Text>
                      ))}
                      {info?.cast?.slice(0, 3).map((actor: string) => (
                        <Text
                          key={actor}
                          className="text-white text-xs bg-tertiary p-1 rounded-sm">
                          {actor}
                        </Text>
                      ))}
                    </View>
                  </View>
                )}
                {/* synopsis */}
                <View className="mb-2 w-full flex-row items-center justify-between">
                  <Skeleton show={infoLoading} colorMode="dark" width={180}>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white text-xl font-semibold">
                        Synopsis
                      </Text>
                      <Text className="text-white text-xs bg-tertiary p-1 px-2 rounded-sm">
                        {route.params.provider || provider.value}
                      </Text>
                    </View>
                  </Skeleton>
                  <View className="flex-row items-center gap-4">
                    <MaterialCommunityIcons
                      name="web"
                      size={25}
                      color="rgb(156 163 175)"
                      onPress={async () => {
                        navigation.navigate('Webview', {
                          link: route.params.link,
                        });
                      }}
                    />
                    {inLibrary ? (
                      <Ionicons
                        name="bookmark"
                        size={30}
                        color="tomato"
                        onPress={() => removeLibrary()}
                      />
                    ) : (
                      <Ionicons
                        name="bookmark-outline"
                        size={30}
                        color="tomato"
                        onPress={() => addLibrary()}
                      />
                    )}
                  </View>
                </View>
                <Skeleton show={infoLoading} colorMode="dark" height={20}>
                  <Text className="text-white text-xs px-1">
                    {meta?.description
                      ? meta?.description.length > 180
                        ? meta?.description.slice(0, 180) + '...'
                        : meta?.description
                      : info?.synopsis?.length! > 180
                      ? info?.synopsis.slice(0, 180) + '...'
                      : info?.synopsis || 'No synopsis available'}
                  </Text>
                </Skeleton>
                {/* cast */}
              </View>
              <View className="p-4 bg-black">
                {infoLoading || !info?.linkList ? (
                  <View className="gap-y-3 items-start mb-4 p-3">
                    <Skeleton
                      show={true}
                      colorMode="dark"
                      height={30}
                      width={80}
                    />
                    {[...Array(1)].map((_, i) => (
                      <View
                        className="bg-tertiary p-1 rounded-md gap-3 mt-3"
                        key={i}>
                        <Skeleton
                          show={true}
                          colorMode="dark"
                          height={20}
                          width={'100%'}
                        />
                      </View>
                    ))}
                  </View>
                ) : (
                  <SeasonList
                    refreshing={refreshing}
                    providerValue={route.params.provider || provider.value}
                    LinkList={
                      info?.linkList
                        ? info?.linkList?.filter(
                            item =>
                              (
                                MMKV.getArray('ExcludedQualities') || []
                              )?.includes(item.quality) === false,
                          )?.length! > 0
                          ? info?.linkList?.filter(
                              item =>
                                (
                                  MMKV.getArray('ExcludedQualities') || []
                                )?.includes(item.quality) === false,
                            )
                          : info?.linkList
                        : []
                    }
                    poster={meta?.logo || ''}
                    metaTitle={meta?.name || info?.title}
                    routeParams={route.params}
                  />
                )}
              </View>
            </>
          }
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              colors={['tomato']}
              tintColor="tomato"
              progressBackgroundColor={'black'}
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                setTimeout(() => setRefreshing(false), 1000);
              }}
            />
          }
        />
      </View>
    </View>
  );
}

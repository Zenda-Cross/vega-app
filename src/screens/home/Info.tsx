import {Image, Text, View, RefreshControl, ScrollView} from 'react-native';
import React, {useEffect, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../../App';
import {getInfo} from '../../lib/getInfo';
import type {Info} from '../../lib/getInfo';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import SeasonList from '../../components/SeasonList';
import {OrientationLocker, PORTRAIT} from 'react-native-orientation-locker';
import {Skeleton} from 'moti/skeleton';
import {MotiSafeAreaView} from 'moti';

type Props = NativeStackScreenProps<HomeStackParamList, 'Info'>;
export default function Info({route}: Props): React.JSX.Element {
  const [info, setInfo] = useState<Info>();
  const [meta, setMeta] = useState<any>();
  const [infoLoading, setInfoLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    const fetchInfo = async () => {
      setInfoLoading(true);
      const data = await getInfo(route.params.link);
      const metaRes = await axios.get(
        `https://v3-cinemeta.strem.io/meta/${data.type}/${data.imdbId}.json`,
      );
      setInfo(data);
      setMeta(metaRes.data.meta);
      setInfoLoading(false);
      console.log(info?.linkList);
    };
    fetchInfo();
  }, [refreshing]);
  return (
    <MotiSafeAreaView
      animate={{backgroundColor: 'black'}}
      //@ts-ignore
      transition={{type: 'timing'}}
      className="h-full w-full">
      <ScrollView
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
        }>
        <OrientationLocker orientation={PORTRAIT} />
        <View className="relative w-full h-[230px]">
          <View className="absolute w-full h-full">
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
                      'https://via.placeholder.com',
                  }}
                  className=" h-56 w-full"
                />
              }
            </Skeleton>
          </View>
          <LinearGradient
            colors={['transparent', 'black']}
            className="absolute h-full w-full"
          />
          <View className="absolute bottom-0 right-0 w-screen flex-row justify-between items-baseline px-2">
            {meta?.logo ? (
              <Image
                source={{uri: meta?.logo}}
                style={{width: 200, height: 100, resizeMode: 'contain'}}
              />
            ) : (
              <Text className="text-white text-xl font-semibold w-3/4 truncate">
                {info?.title}
              </Text>
            )}
            {/* rating */}
            {meta?.imdbRating && (
              <Text className="text-white text-2xl font-semibold">
                {meta?.imdbRating}
                <Text className="text-white text-lg">/10</Text>
              </Text>
            )}
          </View>
        </View>
        <View className="p-4">
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
          </View>
          {/* synopsis */}
          <View className="mb-2">
            <Skeleton show={infoLoading} colorMode="dark" width={80}>
              <Text className="text-white text-lg font-semibold">Synopsis</Text>
            </Skeleton>
          </View>
          <Skeleton show={infoLoading} colorMode="dark" height={50}>
            <Text className="text-white text-xs">
              {meta?.description
                ? meta?.description
                : info?.synopsis?.length! > 200
                ? info?.synopsis.slice(0, 200) + '...'
                : info?.synopsis || ''}
            </Text>
          </Skeleton>
        </View>
        <View className="p-4">
          {infoLoading ? (
            <View className="gap-y-3 items-start mb-4 p-3">
              <Skeleton show={true} colorMode="dark" height={30} width={80} />
              {[...Array(4)].map((_, i) => (
                <View
                  className="bg-tertiary py-1 rounded-md gap-3 mt-3"
                  key={i}>
                  <Skeleton
                    show={true}
                    colorMode="dark"
                    height={40}
                    width={'100%'}
                  />
                </View>
              ))}
            </View>
          ) : (
            <SeasonList
              LinkList={info?.linkList || []}
              poster={meta?.logo?.replace('medium', 'large') || ''}
              title={meta?.name || ''}
            />
          )}
        </View>
      </ScrollView>
    </MotiSafeAreaView>
  );
}

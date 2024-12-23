import {View, Text, TouchableOpacity} from 'react-native';
import React, {useEffect, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList, SearchStackParamList} from '../App';
import {Post} from '../lib/providers/types';
import {Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import useContentStore from '../lib/zustand/contentStore';
import {manifest} from '../lib/Manifest';
import {MaterialIcons} from '@expo/vector-icons';
import {MMKV} from '../lib/Mmkv';
import {FlashList} from '@shopify/flash-list';
import SkeletonLoader from '../components/Skeleton';
import useThemeStore from '../lib/zustand/themeStore';

type Props = NativeStackScreenProps<HomeStackParamList, 'ScrollList'>;

const ScrollList = ({route}: Props): React.ReactElement => {
  const {primary} = useThemeStore(state => state);
  const navigation =
    useNavigation<NativeStackNavigationProp<SearchStackParamList>>();
  const [posts, setPosts] = useState<Post[]>([]);
  const {filter} = route.params;
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEnd, setIsEnd] = useState<boolean>(false);
  const {provider} = useContentStore(state => state);
  const [viewType, setViewType] = useState<number>(
    MMKV.getInt('viewType') || 1,
  );
  console.log('isl', isLoading);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const fetchPosts = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(true);
      const getNewPosts = route.params.isSearch
        ? manifest[route.params.providerValue || provider.value].GetSearchPosts(
            filter,
            page,
            provider.value,
            signal,
          )
        : manifest[route.params.providerValue || provider.value].GetHomePosts(
            filter,
            page,
            provider.value,
            signal,
          );
      const newPosts = await getNewPosts;
      if (newPosts?.length === 0 && (page > 2 || page === 1)) {
        console.log('end', page);
        setIsEnd(true);
        setIsLoading(false);
        return;
      }
      setPosts(prev => [...prev, ...newPosts]);
    };
    fetchPosts();
  }, [page]);

  const onEndReached = async () => {
    if (isEnd) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setPage(page + 1);
  };

  return (
    <View className="h-full w-full bg-black items-center p-4">
      <View className="w-full px-4 font-semibold my-6 flex-row justify-between items-center">
        <Text className="text-2xl font-bold" style={{color: primary}}>
          {route.params.title}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setViewType(viewType === 1 ? 2 : 1);
            MMKV.setInt('viewType', viewType === 1 ? 2 : 1);
          }}>
          <MaterialIcons
            name={viewType === 1 ? 'view-module' : 'view-list'}
            size={27}
            color="white"
          />
        </TouchableOpacity>
      </View>
      <View className="justify-center flex-row w-96 ">
        <FlashList
          estimatedItemSize={300}
          ListFooterComponent={
            <>
              {isLoading && viewType === 1 ? (
                <View className="flex flex-row gap-1 flex-wrap justify-center items-center mb-16">
                  {[...Array(6)].map((_, i) => (
                    <View
                      className="mx-3 gap-0 flex mb-3 justify-center items-center"
                      key={i}>
                      <SkeletonLoader height={150} width={100} />
                      <SkeletonLoader height={12} width={97} />
                    </View>
                  ))}
                </View>
              ) : (
                <View className="h-32" />
              )}
              <View className="h-16" />
            </>
          }
          data={posts}
          numColumns={viewType === 1 ? 3 : 1}
          key={viewType}
          contentContainerStyle={
            {
              // flexDirection: 'row',
              // flexWrap: 'wrap',
            }
          }
          keyExtractor={(item, i) => item.title + i}
          renderItem={({item}) => (
            <TouchableOpacity
              className={
                viewType === 1
                  ? 'flex flex-col m-3'
                  : 'flex-row m-3 items-center'
              }
              onPress={() =>
                navigation.navigate('Info', {
                  link: item.link,
                  provider: route.params.providerValue || provider.value,
                  poster: item?.image,
                })
              }>
              <Image
                className="rounded-md"
                source={{
                  uri:
                    item.image ||
                    'https://placehold.jp/24/363636/ffffff/100x150.png?text=Vega',
                }}
                style={
                  viewType === 1
                    ? {width: 100, height: 150}
                    : {width: 70, height: 100}
                }
              />
              <Text
                className={
                  viewType === 1
                    ? 'text-white text-center truncate w-24 text-xs'
                    : 'text-white ml-3 truncate w-72 font-semibold text-base'
                }>
                {item?.title?.length > 24 && viewType === 1
                  ? item.title.slice(0, 24) + '...'
                  : item.title}
              </Text>
            </TouchableOpacity>
          )}
          onEndReached={onEndReached}
        />
        {!isLoading && posts.length === 0 ? (
          <View className="w-full h-full flex items-center justify-center">
            <Text className="text-white text-center font-semibold text-lg">
              Not Content Found
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default ScrollList;

import {View, Text, TouchableOpacity} from 'react-native';
import React, {useEffect, useState, useRef} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList, SearchStackParamList} from '../App';
import {Post} from '../lib/providers/types';
import {Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import useContentStore from '../lib/zustand/contentStore';
import {MaterialIcons} from '@expo/vector-icons';
import {settingsStorage} from '../lib/storage';
import {FlashList} from '@shopify/flash-list';
import SkeletonLoader from '../components/Skeleton';
import useThemeStore from '../lib/zustand/themeStore';
import {providerManager} from '../lib/services/ProviderManager';

type Props = NativeStackScreenProps<HomeStackParamList, 'ScrollList'>;

const ScrollList = ({route}: Props): React.ReactElement => {
  const {primary} = useThemeStore(state => state);
  const navigation =
    useNavigation<NativeStackNavigationProp<SearchStackParamList>>();
  const [posts, setPosts] = useState<Post[]>([]);
  const {filter, providerValue} = route.params;
  const [page, setPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEnd, setIsEnd] = useState<boolean>(false);
  const {provider} = useContentStore(state => state);
  const [viewType, setViewType] = useState<number>(
    settingsStorage.getListViewType(),
  );
  // Add abort controller to cancel API requests when unmounting
  const abortController = useRef<AbortController | null>(null);
  const isMounted = useRef(true);
  const isLoadingMore = useRef(false);

  // Set up cleanup effect that runs on component unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    // Clean up the previous controller if it exists
    if (abortController.current) {
      abortController.current.abort();
    }

    // Create a new controller for this effect
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    const fetchPosts = async () => {
      // Don't fetch if we're already at the end
      if (isEnd) return;

      try {
        // Prevent concurrent loading calls
        if (isLoadingMore.current) return;
        isLoadingMore.current = true;

        setIsLoading(true);

        // Simulate network delay to reduce rapid API calls
        // Remove this in production if not needed
        await new Promise(resolve => setTimeout(resolve, 300));

        // Skip if component unmounted or request was aborted
        if (!isMounted.current || signal.aborted) return;

        const getNewPosts = route.params.isSearch
          ? providerManager.getSearchPosts({
              searchQuery: filter,
              page,
              providerValue: providerValue || provider.value,
              signal,
            })
          : providerManager.getPosts({
              filter,
              page,
              providerValue: providerValue || provider.value,
              signal,
            });

        const newPosts = await getNewPosts;

        // Skip if component unmounted or request was aborted
        if (!isMounted.current || signal.aborted) return;

        if (!newPosts || newPosts.length === 0) {
          console.log('end', page);
          setIsEnd(true);
          setIsLoading(false);
          isLoadingMore.current = false;
          return;
        }

        setPosts(prev => [...prev, ...newPosts]);
      } catch (error) {
        // Skip handling if component unmounted or request was aborted
        if (!isMounted.current || (error as any)?.name === 'AbortError') return;
        console.error('Error fetching posts:', error);
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          isLoadingMore.current = false;
        }
      }
    };

    fetchPosts();
  }, [page, route.params, filter, provider.value]);

  const onEndReached = async () => {
    // Don't trigger more loading if we're already loading or at the end
    if (isLoading || isEnd || isLoadingMore.current) {
      return;
    }
    setIsLoading(true);
    setPage(prevPage => prevPage + 1);
  };

  // Limit the number of skeletons to prevent unnecessary renders
  const renderSkeletons = () => {
    const skeletonCount = viewType === 1 ? 6 : 3;
    return Array.from({length: skeletonCount}).map((_, i) => (
      <View
        className="mx-3 gap-0 flex mb-3 justify-center items-center"
        key={i}>
        <SkeletonLoader height={150} width={100} />
        <SkeletonLoader height={12} width={97} />
      </View>
    ));
  };

  return (
    <View className="h-full w-full bg-black items-center p-4">
      <View className="w-full px-4 font-semibold my-6 flex-row justify-between items-center">
        <Text className="text-2xl font-bold" style={{color: primary}}>
          {route.params.title}
        </Text>
        <TouchableOpacity
          onPress={() => {
            const newViewType = viewType === 1 ? 2 : 1;
            setViewType(newViewType);
            settingsStorage.setListViewType(newViewType);
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
              {isLoading && (
                <View
                  className={`flex ${
                    viewType === 1 ? 'flex-row flex-wrap' : 'flex-col'
                  } gap-1 justify-center items-center mb-16`}>
                  {renderSkeletons()}
                </View>
              )}
              <View className="h-32" />
            </>
          }
          data={posts}
          numColumns={viewType === 1 ? 3 : 1}
          key={`view-type-${viewType}`}
          contentContainerStyle={{paddingBottom: 80}}
          keyExtractor={(item, i) => `${item.title}-${i}`}
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
          onEndReachedThreshold={0.5}
        />
        {!isLoading && posts.length === 0 ? (
          <View className="w-full h-full flex items-center justify-center">
            <Text className="text-white text-center font-semibold text-lg">
              No Content Found
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

export default ScrollList;

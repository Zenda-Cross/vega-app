import {
  SafeAreaView,
  ScrollView,
  RefreshControl,
  StatusBar,
  View,
} from 'react-native';
import Slider from '../../components/Slider';
import React, {useEffect, useRef, useState} from 'react';
import Hero from '../../components/Hero';
import {getHomePageData, HomePageData} from '../../lib/getHomepagedata';
import {mainStorage, cacheStorage} from '../../lib/storage';
import useContentStore from '../../lib/zustand/contentStore';
import useHeroStore from '../../lib/zustand/herostore';
// import {FFmpegKit} from 'ffmpeg-kit-react-native';
// import useWatchHistoryStore from '../../lib/zustand/watchHistrory';
import useThemeStore from '../../lib/zustand/themeStore';
import ProviderDrawer from '../../components/ProviderDrawer';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../../App';
import DrawerLayout from 'react-native-gesture-handler/DrawerLayout';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import ContinueWatching from '../../components/ContinueWatching';
import {providerManager} from '../../lib/services/ProviderManager';
import Tutorial from '../../components/Touturial';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;
const Home = ({}: Props) => {
  const {primary} = useThemeStore(state => state);
  const [refreshing, setRefreshing] = useState(false);
  const [homeData, setHomeData] = useState<HomePageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('transparent');
  // const recentlyWatched = useWatchHistoryStore(state => state).history;
  // const ShowRecentlyWatched = MMKV.getBool('showRecentlyWatched');
  const drawer = useRef<DrawerLayout>(null);
  const [isDrawerOpen] = useState(false);
  const disableDrawer = mainStorage.getBool('disableDrawer') || false;

  const {provider, installedProviders} = useContentStore(state => state);
  const {setHero} = useHeroStore(state => state);

  // change status bar color
  const handleScroll = (event: any) => {
    setBackgroundColor(
      event.nativeEvent.contentOffset.y > 0 ? 'black' : 'transparent',
    );
  };

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const fetchHomeData = async () => {
      setLoading(true);
      setHero({link: '', image: '', title: ''});
      const cache = cacheStorage.getString('homeData' + provider.value);
      // console.log('cache', cache);
      if (cache) {
        const data = JSON.parse(cache as string);
        setHomeData(data);
        // pick random post form random category
        const randomPost =
          data[data?.length - 1].Posts[
            Math.floor(Math.random() * data[data?.length - 1].Posts.length)
          ];
        setHero(randomPost);

        setLoading(false);
      }
      const data = await getHomePageData(provider, signal);
      if (!cache && data.length > 0) {
        const randomPost =
          data[data?.length - 1].Posts[
            Math.floor(Math.random() * data[data?.length - 1].Posts.length)
          ];
        setHero(randomPost);
      }

      if (
        data[data?.length - 1].Posts.length === 0 ||
        data[0].Posts.length === 0
      ) {
        return;
      }
      setLoading(false);
      setHomeData(data);
      cacheStorage.setString('homeData' + provider.value, JSON.stringify(data));
    };
    fetchHomeData();
    return () => {
      controller.abort();
    };
  }, [refreshing, provider]);

  if (
    !installedProviders ||
    installedProviders.length === 0 ||
    !provider?.value
  ) {
    return <Tutorial />;
  }
  return (
    <GestureHandlerRootView>
      <SafeAreaView className="bg-black flex-1">
        <DrawerLayout
          drawerPosition="left"
          drawerWidth={200}
          drawerLockMode={disableDrawer ? 'locked-closed' : 'unlocked'}
          drawerType="front"
          edgeWidth={70}
          useNativeAnimations={false}
          // onDrawerOpen={() => setIsDrawerOpen(true)}
          // onDrawerClose={() => setIsDrawerOpen(false)}
          // onDrawerStateChanged={(newState, drawerWillShow) => {
          //   if (drawerWillShow) {
          //     setIsDrawerOpen(true);
          //   } else {
          //     setIsDrawerOpen(false);
          //   }
          // }}
          ref={drawer}
          drawerBackgroundColor={'transparent'}
          renderNavigationView={() =>
            !disableDrawer && <ProviderDrawer drawerRef={drawer} />
          }>
          <StatusBar
            showHideTransition={'fade'}
            animated={true}
            translucent={true}
            backgroundColor={backgroundColor}
          />
          <ScrollView
            onScroll={handleScroll}
            showsVerticalScrollIndicator={false}
            className="bg-black"
            refreshControl={
              <RefreshControl
                colors={[primary]}
                tintColor={primary}
                progressBackgroundColor={'black'}
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  setTimeout(() => setRefreshing(false), 1000);
                }}
              />
            }>
            <Hero drawerRef={drawer} isDrawerOpen={isDrawerOpen} />
            <ContinueWatching />
            <View className="-mt-6 relative z-20">
              {/* use new continue watching component */}
              {/* {!loading &&
                recentlyWatched?.length > 0 &&
                ShowRecentlyWatched && (
                  <Slider
                    isLoading={loading}
                    title={'Continue Watching'}
                    posts={recentlyWatched}
                    filter={'recent'}
                  />
                )} */}
              {loading
                ? providerManager
                    .getCatalog({
                      providerValue: provider.value,
                    })
                    .map((item, index) => (
                      <Slider
                        isLoading={loading}
                        key={index}
                        title={item.title}
                        posts={[]}
                        filter={item.filter}
                      />
                    ))
                : homeData.map((item, index) => (
                    <Slider
                      isLoading={loading}
                      key={index}
                      title={item.title}
                      posts={item.Posts}
                      filter={item.filter}
                    />
                  ))}
            </View>
            <View className="h-16" />
          </ScrollView>
        </DrawerLayout>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default Home;

import {
  SafeAreaView,
  ScrollView,
  RefreshControl,
  StatusBar,
} from 'react-native';
import Slider from '../../components/Slider';
import React, {useEffect, useState} from 'react';
import {OrientationLocker, PORTRAIT} from 'react-native-orientation-locker';
import Hero from '../../components/Hero';
import {View} from 'moti';
import {getHomePageData, HomePageData} from '../../lib/getPosts';
import {homeList} from '../../lib/constants';
import {MmmkvCache} from '../../App';
import {checkForExistingDownloads} from '@kesha-antonov/react-native-background-downloader';
import useContentStore from '../../lib/zustand/contentStore';
import useHeroStore from '../../lib/zustand/herostore';

const Home = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [homeData, setHomeData] = useState<HomePageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('transparent');

  const {contentType} = useContentStore(state => state);
  const {hero, setHero} = useHeroStore(state => state);

  // change status bar color
  const handleScroll = (event: any) => {
    setBackgroundColor(
      event.nativeEvent.contentOffset.y > 0 ? 'black' : 'transparent',
    );
  };

  const deleteDownload = async () => {
    const tasks = await checkForExistingDownloads();
    for (const task of tasks) {
      if (task.state !== 'DOWNLOADING') {
        task.stop();
      }
    }
  };
  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const fetchHomeData = async () => {
      setLoading(true);
      setHero({link: '', image: '', title: ''});
      const cache = MmmkvCache.getString('homeData' + contentType);
      // console.log('cache', cache);
      if (cache) {
        const data = JSON.parse(cache as string);
        // pick random post form random category
        const randomPost =
          data[3].Posts[Math.floor(Math.random() * data[3].Posts.length)];
        setHero(randomPost);

        setLoading(false);
        setHomeData(data);
      }
      const data = await getHomePageData(contentType, signal);
      if (!cache && data.length > 0) {
        const randomPost =
          data[3].Posts[Math.floor(Math.random() * data[3].Posts.length)];
        setHero(randomPost);
      }
      if (data[1].Posts.length === 0) {
        return;
      }
      setLoading(false);
      setHomeData(data);
      MmmkvCache.setString('homeData' + contentType, JSON.stringify(data));
    };
    fetchHomeData();
    deleteDownload();
    return () => {
      controller.abort();
    };
  }, [refreshing, contentType]);
  return (
    <SafeAreaView className="bg-black h-full w-full">
      <StatusBar
        showHideTransition={'fade'}
        animated={true}
        translucent={true}
        backgroundColor={backgroundColor}
      />
      <OrientationLocker orientation={PORTRAIT} />
      <ScrollView
        onScroll={handleScroll}
        showsVerticalScrollIndicator={false}
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
        <Hero />
        <View className="p-4">
          {loading
            ? homeList.map((item, index) => (
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;

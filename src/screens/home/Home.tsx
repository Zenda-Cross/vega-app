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

const Home = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [homeData, setHomeData] = useState<HomePageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [backgroundColor, setBackgroundColor] = useState('transparent');

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
    let ignore = false;
    const fetchHomeData = async () => {
      setLoading(true);
      const cache = (await MmmkvCache.getItem('homeData')) || '';
      // console.log('cache', cache);
      if (cache) {
        const data = JSON.parse(cache as string);
        setLoading(false);
        setHomeData(data);
      }
      const data = await getHomePageData();
      if (data[1].Posts.length === 0) {
        return;
      }
      setLoading(false);
      setHomeData(data);
      MmmkvCache.setItem('homeData', JSON.stringify(data));
    };
    if (!ignore) {
      fetchHomeData();
      deleteDownload();
    }
    return () => {
      ignore = true;
    };
  }, [refreshing]);
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
                />
              ))
            : homeData.map((item, index) => (
                <Slider
                  isLoading={loading}
                  key={index}
                  title={item.title}
                  posts={item.Posts}
                />
              ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;

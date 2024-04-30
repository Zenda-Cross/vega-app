import {SafeAreaView, ScrollView, RefreshControl} from 'react-native';
import Slider from '../../components/Slider';
import React, {useEffect} from 'react';
import {OrientationLocker, PORTRAIT} from 'react-native-orientation-locker';
import Hero from '../../components/Hero';
import {View} from 'moti';
import {getHomePageData, HomePageData} from '../../lib/getPosts';
import {homeList} from '../../lib/constants';

const Home = () => {
  const [refreshing, setRefreshing] = React.useState(false);
  const [homeData, setHomeData] = React.useState<HomePageData[]>([]);
  const [loading, setLoading] = React.useState(true);
  useEffect(() => {
    let ignore = false;
    const fetchHomeData = async () => {
      setLoading(true);
      const data = await getHomePageData();
      setLoading(false);
      setHomeData(data);
    };
    if (!ignore) {
      fetchHomeData();
    }
    return () => {
      ignore = true;
    };
  }, [refreshing]);
  return (
    <SafeAreaView className="bg-black h-full w-full">
      <OrientationLocker orientation={PORTRAIT} />
      <ScrollView
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

import {SafeAreaView, ScrollView, RefreshControl} from 'react-native';
import Slider from '../../components/Slider';
import React, {useEffect} from 'react';
import {OrientationLocker, PORTRAIT} from 'react-native-orientation-locker';
import Hero from '../../components/Hero';
import {View} from 'moti';
import {getHomePageData, HomePageData} from '../../lib/getPosts';

const Home = () => {
  const [refreshing, setRefreshing] = React.useState(false);
  const [homeData, setHomeData] = React.useState<HomePageData[]>([]);
  const [loading, setLoading] = React.useState(true);
  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      const data = await getHomePageData();
      setLoading(false);
      setHomeData(data);
    };
    fetchHomeData();
  }, [refreshing]);
  return (
    <SafeAreaView className="bg-black h-full w-full">
      <OrientationLocker orientation={PORTRAIT} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              setTimeout(() => setRefreshing(false), 1000);
            }}
          />
        }>
        <Hero />
        <View className="p-4">
          {homeData.map((item, index) => (
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

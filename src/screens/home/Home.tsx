import {SafeAreaView, ScrollView} from 'react-native';
import Slider from '../../components/Slider';
import React from 'react';
import {OrientationLocker, PORTRAIT} from 'react-native-orientation-locker';

const Home = () => {
  return (
    <SafeAreaView className="bg-black p-4 h-full w-full">
      <OrientationLocker orientation={PORTRAIT} />
      <ScrollView showsVerticalScrollIndicator={false}>
        <Slider filter="d" title="Latest" />
        <Slider filter="category/web-series/netflix" title="Netflix" />
        <Slider
          filter="category/web-series/amazon-prime-video"
          title="Amazon Prime"
        />
        <Slider filter="category/movies-by-quality/2160p" title="4K Movies" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default Home;

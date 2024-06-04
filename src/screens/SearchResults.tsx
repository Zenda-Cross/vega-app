import {
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Text,
  StatusBar,
} from 'react-native';
import Slider from '../components/Slider';
import React, {useEffect, useState} from 'react';
import {OrientationLocker, PORTRAIT} from 'react-native-orientation-locker';
import {View} from 'moti';
import {providersList} from '../lib/constants';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SearchStackParamList} from '../App';
import {SearchPageData} from '../lib/getSearchResults';
import {getSearchResults} from '../lib/getSearchResults';

type Props = NativeStackScreenProps<SearchStackParamList, 'SearchResults'>;

const SearchResults = ({route}: Props): React.ReactElement => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchData, setSearchData] = useState<SearchPageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const fetchHomeData = async () => {
      setLoading(true);
      const data = await getSearchResults(route.params.filter, signal);
      setSearchData(data);
      setLoading(false);
    };
    fetchHomeData();
    return () => {
      controller.abort();
    };
  }, [refreshing]);
  return (
    <SafeAreaView className="bg-black h-full w-full">
      <StatusBar translucent={false} backgroundColor="black" />
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
        <Text className="text-white text-2xl font-semibold px-4 mt-3 ">
          Search Results
        </Text>
        <View className="px-4">
          {loading
            ? providersList.map((item, index) => (
                <Slider
                  isLoading={loading}
                  key={index}
                  title={item.name}
                  posts={[]}
                  filter={item.value}
                  providerValue={item.value}
                />
              ))
            : searchData.map((item, index) => (
                <Slider
                  isLoading={loading}
                  key={index}
                  title={item.title}
                  posts={item.Posts}
                  filter={item.filter}
                  providerValue={item.providerValue}
                />
              ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchResults;

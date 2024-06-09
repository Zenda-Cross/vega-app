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
import {manifest} from '../lib/Manifest';

type Props = NativeStackScreenProps<SearchStackParamList, 'SearchResults'>;

const SearchResults = ({route}: Props): React.ReactElement => {
  const [refreshing, setRefreshing] = useState(false);
  const [searchData, setSearchData] = useState<SearchPageData[]>([]);
  const trueLoading = providersList.map(item => {
    return {name: item.name, value: item.value, isLoading: true};
  });
  const [loading, setLoading] = useState(trueLoading);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;
    const getSearchResults = async () => {
      for (const item of providersList) {
        const data = await manifest[item.value].getPosts(
          route.params.filter,
          1,
          item,
          signal,
        );
        setSearchData(prev => [
          ...prev,
          {
            title: item.name,
            Posts: data,
            filter: route.params.filter,
            providerValue: item.value,
          },
        ]);
        setLoading(prev => {
          return prev.map(i => {
            if (i.value === item.value) {
              return {name: i.name, value: i.value, isLoading: false};
            }
            return i;
          });
        });
      }
    };
    getSearchResults();
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
          {providersList.map((item, index) => (
            <Slider
              isLoading={
                loading?.find(i => i.value === item.value)?.isLoading || false
              }
              key={index}
              title={item.name}
              posts={
                searchData?.find(i => i.providerValue === item.value)?.Posts ||
                []
              }
              filter={route.params.filter}
              providerValue={item.value}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchResults;

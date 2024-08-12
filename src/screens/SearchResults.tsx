import {SafeAreaView, ScrollView, ActivityIndicator, Text} from 'react-native';
import Slider from '../components/Slider';
import React, {useEffect, useState} from 'react';
import {View} from 'moti';
import {providersList} from '../lib/constants';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SearchStackParamList} from '../App';
import {manifest} from '../lib/Manifest';
import {MMKV} from '../lib/Mmkv';

type Props = NativeStackScreenProps<SearchStackParamList, 'SearchResults'>;

interface SearchPageData {
  title: string;
  Posts: any[];
  filter: string;
  providerValue: string;
  value: string;
  name: string;
}

const SearchResults = ({route}: Props): React.ReactElement => {
  // const [refreshing, setRefreshing] = useState(false);
  const [searchData, setSearchData] = useState<SearchPageData[]>([]);
  const trueLoading = providersList.map(item => {
    return {name: item.name, value: item.value, isLoading: true};
  });
  const disabledProviders = MMKV.getArray('disabledProviders') || [];
  const updatedProvidersList = providersList.filter(
    provider => !disabledProviders.includes(provider.value),
  );
  const [loading, setLoading] = useState(trueLoading);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const getSearchResults = () => {
      updatedProvidersList.forEach(async item => {
        try {
          const data = await manifest[item.value].getPosts(
            route.params.filter,
            1,
            item.value,
            signal,
          );

          setSearchData(prev => [
            ...prev,
            {
              title: item.name,
              Posts: data,
              filter: route.params.filter,
              providerValue: item.value,
              value: item.value,
              name: item.name,
            },
          ]);

          setLoading(prev =>
            prev.map(i =>
              i.value === item.value ? {...i, isLoading: false} : i,
            ),
          );
        } catch (error) {
          console.error(`Error fetching data for ${item.name}:`, error);
          setLoading(prev =>
            prev.map(i =>
              i.value === item.value
                ? {...i, isLoading: false, error: true}
                : i,
            ),
          );
        }
      });
    };

    getSearchResults();

    return () => {
      controller.abort();
    };
  }, []);
  return (
    <SafeAreaView className="bg-black h-full w-full">
      {/* <StatusBar translucent={false} backgroundColor="black" /> */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        // refreshControl={
        //   <RefreshControl
        //     colors={['tomato']}
        //     tintColor="tomato"
        //     progressBackgroundColor={'black'}
        //     refreshing={refreshing}
        //     onRefresh={() => {
        //       setRefreshing(true);
        //       setTimeout(() => setRefreshing(false), 1000);
        //     }}
        //   />
        // }
      >
        {/* <Text className="text-white text-2xl font-semibold px-4 mt-3 ">
          Search Results
        </Text> */}
        <View className="mt-14 px-4">
          <Text className="text-white text-xl font-semibold ">
            Search Results for{' '}
            <Text className="text-primary">
              "{route?.params?.filter?.replace('searchQuery=', '')}"
            </Text>
          </Text>
        </View>

        <View className="px-4">
          {searchData?.map((item, index) => (
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
        {!loading?.every(i => !i.isLoading) && (
          <View className="flex justify-center items-center h-20">
            <ActivityIndicator size="large" color="tomato" animating={true} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchResults;

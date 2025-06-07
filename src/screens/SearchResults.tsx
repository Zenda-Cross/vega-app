import {SafeAreaView, ScrollView, ActivityIndicator, Text} from 'react-native';
import Slider from '../components/Slider';
import React, {useEffect, useState, useRef} from 'react';
import {View} from 'moti';
import {providersList} from '../lib/constants';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SearchStackParamList} from '../App';
import {manifest} from '../lib/Manifest';
import {providersStorage} from '../lib/storage';
import useThemeStore from '../lib/zustand/themeStore';

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
  const {primary} = useThemeStore(state => state);
  const [searchData, setSearchData] = useState<SearchPageData[]>([]);
  const [emptyResults, setEmptyResults] = useState<SearchPageData[]>([]);
  const trueLoading = providersList.map(item => {
    return {name: item.name, value: item.value, isLoading: true};
  });
  // Use settingsStorage instead of direct MMKV call
  const updatedProvidersList = providersList.filter(provider =>
    providersStorage.isProviderDisabled(provider.value),
  );
  const [loading, setLoading] = useState(trueLoading);
  const abortController = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clean up previous controller if exists
    if (abortController.current) {
      abortController.current.abort();
    }

    // Create a new controller for this effect
    abortController.current = new AbortController();
    const signal = abortController.current.signal;

    // Reset states when component mounts or filter changes
    setSearchData([]);
    setEmptyResults([]);
    setLoading(trueLoading);

    const fetchPromises: Promise<void>[] = [];

    const getSearchResults = () => {
      updatedProvidersList.forEach(item => {
        const fetchPromise = (async () => {
          try {
            const data = await manifest[item.value].GetSearchPosts(
              route.params.filter,
              1,
              item.value,
              signal,
            );

            // Skip updating state if request was aborted
            if (signal.aborted) return;

            if (data && data.length > 0) {
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
            } else {
              setEmptyResults(prev => [
                ...prev,
                {
                  title: item.name,
                  Posts: data || [],
                  filter: route.params.filter,
                  providerValue: item.value,
                  value: item.value,
                  name: item.name,
                },
              ]);
            }

            setLoading(prev =>
              prev.map(i =>
                i.value === item.value ? {...i, isLoading: false} : i,
              ),
            );
          } catch (error) {
            if (signal.aborted) return;

            console.error(`Error fetching data for ${item.name}:`, error);
            setLoading(prev =>
              prev.map(i =>
                i.value === item.value
                  ? {...i, isLoading: false, error: true}
                  : i,
              ),
            );
          }
        })();

        fetchPromises.push(fetchPromise);
      });

      // Use Promise.allSettled to handle all promises regardless of their outcome
      return Promise.allSettled(fetchPromises);
    };

    getSearchResults();

    return () => {
      // Cleanup function: abort any ongoing API requests
      if (abortController.current) {
        abortController.current.abort();
        abortController.current = null;
      }
    };
  }, [route.params.filter]);

  return (
    <SafeAreaView className="bg-black h-full w-full">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mt-14 px-4 flex flex-row justify-between items-center gap-x-3">
          <Text className="text-white text-2xl font-semibold ">
            {loading?.every(i => !i.isLoading)
              ? 'Searched for'
              : 'Searching for'}{' '}
            <Text style={{color: primary}}>"{route?.params?.filter}"</Text>
          </Text>
          {!loading?.every(i => !i.isLoading) && (
            <View className="flex justify-center items-center h-20">
              <ActivityIndicator
                size="small"
                color={primary}
                animating={true}
              />
            </View>
          )}
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
              isSearch={true}
            />
          ))}
          {emptyResults?.map((item, index) => (
            <Slider
              isLoading={
                loading?.find(i => i.value === item.value)?.isLoading || false
              }
              key={index}
              title={item.name}
              posts={
                emptyResults?.find(i => i.providerValue === item.value)
                  ?.Posts || []
              }
              filter={route.params.filter}
              providerValue={item.value}
              isSearch={true}
            />
          ))}
        </View>
        <View className="h-16" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default SearchResults;

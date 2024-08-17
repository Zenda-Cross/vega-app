import {View, Text, Switch, ScrollView, TouchableOpacity} from 'react-native';
import React, {useState} from 'react';
import {MMKV} from '../../lib/Mmkv';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import RNReactNativeHapticFeedback from 'react-native-haptic-feedback';
import useWatchHistoryStore from '../../lib/zustand/watchHistrory';

const Preferences = () => {
  const [showRecentlyWatched, setShowRecentlyWatched] = useState(
    MMKV.getBool('showRecentlyWatched') || false,
  );
  const {clearHistory} = useWatchHistoryStore(state => state);

  const [ExcludedQualities, setExcludedQualities] = useState(
    MMKV.getArray('ExcludedQualities') || [],
  );
  return (
    <ScrollView className="w-full h-full bg-black">
      <Text className="text-white mt-10 ml-4 font-bold text-2xl">
        Preference
      </Text>

      <View className="mt-2 p-2">
        {/* show recentlyWatched */}
        <View className="flex-row items-center px-4 justify-between mt-3 bg-tertiary p-2 rounded-md">
          <Text className="text-white font-semibold">
            Show Recently Watched
          </Text>
          <View className="w-20" />
          <Switch
            thumbColor={showRecentlyWatched ? 'tomato' : 'gray'}
            value={showRecentlyWatched}
            onValueChange={() => {
              MMKV.setBool('showRecentlyWatched', !showRecentlyWatched);
              setShowRecentlyWatched(!showRecentlyWatched);
            }}
          />
        </View>

        {/* clear watch history */}
        <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
          <Text className="text-white font-semibold">Clear Watch History</Text>
          <TouchableOpacity
            className="bg-[#343434] w-12 items-center p-2 rounded-md"
            onPress={() => {
              RNReactNativeHapticFeedback.trigger('virtualKey', {
                enableVibrateFallback: true,
                ignoreAndroidSystemSettings: false,
              });
              clearHistory();
            }}>
            <MaterialCommunityIcons
              name="delete-outline"
              size={24}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* Excluded qualities */}
        <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
          <Text className="text-white font-semibold">Excluded qualities</Text>
          <View className="flex flex-row flex-wrap">
            {['480p', '720p', '1080p'].map((quality, index) => (
              <TouchableOpacity
                key={index}
                className={`bg-secondary p-2 rounded-md m-1 ${
                  ExcludedQualities.includes(quality) ? 'bg-primary' : ''
                }`}
                onPress={() => {
                  RNReactNativeHapticFeedback.trigger('effectTick', {
                    enableVibrateFallback: true,
                    ignoreAndroidSystemSettings: false,
                  });
                  if (ExcludedQualities.includes(quality)) {
                    setExcludedQualities(prev =>
                      prev.filter(q => q !== quality),
                    );
                    MMKV.setArray(
                      'ExcludedQualities',
                      ExcludedQualities.filter(q => q !== quality),
                    );
                  } else {
                    setExcludedQualities(prev => [...prev, quality]);
                    MMKV.setArray('ExcludedQualities', [
                      ...ExcludedQualities,
                      quality,
                    ]);
                  }
                  console.log(ExcludedQualities);
                }}>
                <Text className="text-white text-xs rounded-md px-1">
                  {quality}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default Preferences;

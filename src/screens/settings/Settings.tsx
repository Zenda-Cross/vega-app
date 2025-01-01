import {
  View,
  Text,
  Linking,
  TouchableOpacity,
  TouchableNativeFeedback,
} from 'react-native';
import React from 'react';
import {MmmkvCache} from '../../lib/Mmkv';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import useContentStore from '../../lib/zustand/contentStore';
import {Dropdown} from 'react-native-element-dropdown';
import {providersList, socialLinks} from '../../lib/constants';
import {startActivityAsync, ActivityAction} from 'expo-intent-launcher';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SettingsStackParamList} from '../../App';
import {
  MaterialCommunityIcons,
  AntDesign,
  Feather,
  MaterialIcons,
} from '@expo/vector-icons';
import {ScrollView} from 'react-native';
import useThemeStore from '../../lib/zustand/themeStore';
import useWatchHistoryStore from '../../lib/zustand/watchHistrory';
import {SvgUri} from 'react-native-svg';

type Props = NativeStackScreenProps<SettingsStackParamList, 'Settings'>;

const Settings = ({navigation}: Props) => {
  const {primary} = useThemeStore(state => state);

  const {provider, setProvider} = useContentStore(state => state);
  const {clearHistory} = useWatchHistoryStore(state => state);

  return (
    <ScrollView className="w-full h-full bg-black p-4">
      <Text className="text-2xl font-bold text-white mt-7">Settings</Text>
      {/* Content provider */}
      {
        <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
          <Text className="font-bold text-lg" style={{color: primary}}>
            Change Provider
          </Text>
          <View className="w-40">
            <Dropdown
              selectedTextStyle={{
                color: 'white',
                overflow: 'hidden',
                fontWeight: 'bold',
                height: 23,
              }}
              containerStyle={{
                borderColor: '#363636',
                width: 160,
                borderRadius: 5,
                overflow: 'hidden',
                padding: 2,
                backgroundColor: 'black',
                maxHeight: 450,
              }}
              labelField={'name'}
              valueField={'value'}
              placeholder="Select"
              value={provider}
              data={providersList}
              onChange={async provider => {
                setProvider(provider);
              }}
              renderItem={item => {
                return (
                  <View
                    className={`bg-black text-white w-48 flex-row justify-start gap-2 items-center px-4 py-1 rounded-s-md border-b border-white/10 border rounded-md ${
                      provider.value === item.value ? 'bg-quaternary' : ''
                    } ${item.value === 'guardahd' ? 'pb-1' : 'pb-3'}`}>
                    <SvgUri
                      className="mb-2"
                      width={20}
                      height={20}
                      uri={item.flag}
                    />
                    <Text className=" text-white mb-2">
                      {/* {item.flag}
                      &nbsp; &nbsp; */}
                      {item.name}
                    </Text>
                  </View>
                );
              }}
            />
          </View>
        </View>
      }

      {/* download folder shortcut */}
      <TouchableNativeFeedback
        onPress={async () => {
          navigation.navigate('Downloads');
        }}
        background={TouchableNativeFeedback.Ripple('gray', false)}>
        <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
          <View className="flex-row justify-center items-center gap-1 my-1">
            <MaterialCommunityIcons
              name="folder-download"
              size={18}
              color="white"
            />
            <Text className="text-white font-semibold">Downloads</Text>
          </View>
          <Feather name="chevron-right" size={24} color="white" />
        </View>
      </TouchableNativeFeedback>

      {/* Subtitle Style  */}
      <TouchableNativeFeedback
        onPress={async () => {
          ReactNativeHapticFeedback.trigger('virtualKey', {
            enableVibrateFallback: true,
            ignoreAndroidSystemSettings: false,
          });
          await startActivityAsync(ActivityAction.CAPTIONING_SETTINGS);
        }}
        background={TouchableNativeFeedback.Ripple('gray', false)}>
        <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
          <View className="flex-row justify-center items-center gap-1 my-1">
            <MaterialCommunityIcons name="subtitles" size={18} color="white" />
            <Text className="text-white font-semibold">Subtitle Style</Text>
          </View>
          <Feather name="chevron-right" size={24} color="white" />
        </View>
      </TouchableNativeFeedback>

      {/* disable providers in search */}
      <TouchableNativeFeedback
        onPress={async () => {
          navigation.navigate('DisableProviders');
        }}
        background={TouchableNativeFeedback.Ripple('gray', false)}>
        <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
          <Text className="text-white font-semibold my-2">
            Disable Providers in Search
          </Text>
          <Feather name="chevron-right" size={24} color="white" />
        </View>
      </TouchableNativeFeedback>

      {/* Preferences */}
      <TouchableNativeFeedback
        onPress={() => {
          navigation.navigate('Preferences');
        }}
        background={TouchableNativeFeedback.Ripple('gray', false)}>
        <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
          <View className="flex-row justify-center items-center gap-1 my-1">
            <MaterialIcons name="room-preferences" size={18} color="white" />
            <Text className="text-white font-semibold">Preference</Text>
          </View>
          <Feather name="chevron-right" size={24} color="white" />
        </View>
      </TouchableNativeFeedback>

      {/* clear cache */}
      <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
        <Text className="text-white font-semibold">Clear Cache</Text>
        <TouchableOpacity
          className="bg-[#343434] w-12 items-center p-2 rounded-md"
          onPress={() => {
            ReactNativeHapticFeedback.trigger('virtualKey', {
              enableVibrateFallback: true,
              ignoreAndroidSystemSettings: false,
            });
            MmmkvCache.clearStore();
          }}>
          <MaterialCommunityIcons
            name="delete-outline"
            size={20}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* clear watch history */}
      <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
        <Text className="text-white font-semibold">Clear Watch History</Text>
        <TouchableOpacity
          className="bg-[#343434] w-12 items-center p-2 rounded-md"
          onPress={() => {
            ReactNativeHapticFeedback.trigger('virtualKey', {
              enableVibrateFallback: true,
              ignoreAndroidSystemSettings: false,
            });
            clearHistory();
          }}>
          <MaterialCommunityIcons
            name="delete-outline"
            size={20}
            color="white"
          />
        </TouchableOpacity>
      </View>

      {/* About */}
      <TouchableNativeFeedback
        onPress={() => {
          navigation.navigate('About');
        }}
        background={TouchableNativeFeedback.Ripple('gray', false)}>
        <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
          <View className="flex-row justify-center items-center gap-1 my-1">
            <Feather name="info" size={15} color="white" />
            <Text className="text-white font-semibold">About</Text>
          </View>
          <Feather name="chevron-right" size={24} color="white" />
        </View>
      </TouchableNativeFeedback>
      <View className="flex-row items-center justify-center gap-4 mt-12">
        <TouchableOpacity
          className="flex-row items-center justify-center "
          onPress={() => Linking.openURL(socialLinks.github)}>
          <AntDesign name="github" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center justify-center "
          onPress={() => Linking.openURL(socialLinks.discord)}>
          <MaterialIcons name="discord" size={27} color="white" />
        </TouchableOpacity>
      </View>
      <View className="h-16" />
    </ScrollView>
  );
};

export default Settings;

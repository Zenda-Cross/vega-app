import {
  View,
  Text,
  Alert,
  Linking,
  TouchableOpacity,
  TouchableNativeFeedback,
} from 'react-native';
import React from 'react';
import {MMKV, MmmkvCache} from '../../lib/Mmkv';
import {useState} from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import useContentStore from '../../lib/zustand/contentStore';
import {Dropdown} from 'react-native-element-dropdown';
import SharedGroupPreferences from 'react-native-shared-group-preferences';
import {providersList} from '../../lib/constants';
import {startActivityAsync, ActivityAction} from 'expo-intent-launcher';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SettingsStackParamList} from '../../App';
import {
  MaterialCommunityIcons,
  AntDesign,
  Feather,
  MaterialIcons,
} from '@expo/vector-icons';

const players = [
  {
    label: 'None',
    value: '',
  },
  {
    label: 'VLC Player',
    value: 'vlc',
  },
  {
    label: 'MX Player',
    value: 'mx',
  },
];

type Props = NativeStackScreenProps<SettingsStackParamList, 'Settings'>;

const Settings = ({navigation}: Props) => {
  const [OpenExternalPlayer, setOpenExternalPlayer] = useState(
    players.find(player => player.value === MMKV.getString('externalPlayer')) ||
      players[0],
  );

  const {provider, setProvider} = useContentStore(state => state);

  return (
    <View className="w-full h-full bg-black p-4">
      <Text className="text-2xl font-bold text-white mt-7">Settings</Text>

      {/* Content provider */}
      {
        <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
          <Text className="text-primary font-bold text-lg">
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
                    className={`bg-black text-white w-48 flex-row justify-start gap-2 items-center px-4 py-1 pb-3 ${
                      provider.value === item.value ? 'bg-quaternary' : ''
                    }`}>
                    <Text className=" text-white mb-2">
                      {item.flag}
                      &nbsp; &nbsp;
                      {item.name}
                    </Text>
                  </View>
                );
              }}
            />
          </View>
        </View>
      }

      {/* open in vlc */}
      <View className="flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
        <View className="flex-row items-center gap-1">
          <MaterialCommunityIcons name="motion-play" size={18} color="white" />
          <Text className="text-white font-semibold">
            Open in External player
          </Text>
        </View>
        <View className="w-20">
          <Dropdown
            selectedTextStyle={{
              color: 'white',
              overflow: 'hidden',
              height: 23,
            }}
            containerStyle={{
              borderColor: 'black',
              width: 100,
              overflow: 'hidden',
            }}
            labelField={'label'}
            valueField={'value'}
            placeholder="Select"
            value={OpenExternalPlayer}
            data={players}
            onChange={async player => {
              if (player.value === 'vlc') {
                try {
                  await SharedGroupPreferences.isAppInstalledAndroid(
                    'org.videolan.vlc',
                  );
                } catch (error) {
                  Alert.alert(
                    'VLC not installed',
                    'VLC player is not installed on your device',
                    [
                      {
                        text: 'Cancel',
                        onPress: () => {
                          // setOpenExternalPlayer('None');
                          // MMKV.setString('externalPlayer', 'None');
                        },
                      },
                      {
                        text: 'Install',
                        onPress: () =>
                          Linking.openURL(
                            'market://details?id=org.videolan.vlc',
                          ),
                      },
                    ],
                  );
                }
              } else if (player.value === 'mx') {
                try {
                  await SharedGroupPreferences.isAppInstalledAndroid(
                    'com.mxtech.videoplayer.ad',
                  );
                } catch (error) {
                  Alert.alert(
                    'MX Player not installed',
                    'MX player is not installed on your device',
                    [
                      {
                        text: 'Cancel',
                        onPress: () => {
                          // setOpenExternalPlayer('None');
                          // MMKV.setString('externalPlayer', 'None');
                        },
                      },
                      {
                        text: 'Install',
                        onPress: () => {
                          Linking.openURL(
                            'market://details?id=com.mxtech.videoplayer.ad',
                          );
                        },
                      },
                    ],
                  );
                }
              }
              MMKV.setString('externalPlayer', player.value);
              setOpenExternalPlayer(player);
            }}
            renderItem={item => {
              return (
                <View className="p-2 bg-black text-white w-48 flex-row justify-start gap-2 items-center">
                  <Text className=" text-white">{item.label}</Text>
                </View>
              );
            }}
          />
        </View>
        {/* <Switch
          thumbColor={OpenVlc ? 'tomato' : 'gray'}
          value={OpenVlc}
          onValueChange={async val => {
            MMKV.setBool('vlc', val);
            setOpenVlc(val);
            if (val) {
              const res = await Linking.canOpenURL('vlc://');
              if (!res) {
                Alert.alert(
                  'VLC not installed',
                  'VLC player is not installed on your device',
                  [
                    {text: 'Cancel', onPress: () => setOpenVlc(false)},
                    {
                      text: 'Install',
                      onPress: () =>
                        Linking.openURL('market://details?id=org.videolan.vlc'),
                    },
                  ],
                );
              }
            }
          }}
        /> */}
      </View>

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
            size={24}
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
      <TouchableOpacity
        className="flex-row items-center justify-center gap-4 mt-12"
        onPress={() =>
          Linking.openURL('https://github.com/Zenda-Cross/vega-app')
        }>
        <AntDesign name="github" size={22} color="white" />
        <Text className="text-white text-xs font-semibold">
          Github: Zenda-Cross/vega-app
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default Settings;

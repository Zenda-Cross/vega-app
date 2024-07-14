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
import {Feather} from '@expo/vector-icons';
import {AntDesign} from '@expo/vector-icons';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {SettingsStackParamList} from '../../App';

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

  const [ExcludedQualities, setExcludedQualities] = useState(
    MMKV.getArray('ExcludedQualities') || [],
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

      {/* use custom base URL */}
      {/* <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
        <Text className="text-white font-semibold">use custom base URL</Text>
        <Switch
          thumbColor={UseCustomUrl ? 'tomato' : 'gray'}
          value={UseCustomUrl}
          onValueChange={val => {
            MMKV.setBool('UseCustomUrl', val);
            setUseCustomUrl(val);
          }}
        />
      </View> */}

      {/* open in vlc */}
      <View className="flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
        <Text className="text-white font-semibold">
          Open video in External player
        </Text>
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
          <Text className="text-white font-semibold my-2">Subtitle Style</Text>
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

      {/* Excluded qualities */}
      <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
        <Text className="text-white font-semibold">Excluded qualities</Text>
        <View className="flex flex-row flex-wrap">
          {['480p', '720p', '1080p'].map((quality, index) => (
            <TouchableOpacity
              key={index}
              className={`bg-secondary p-2 rounded-md m-1 ${
                ExcludedQualities.includes(quality) ? 'bg-[#343434]' : ''
              }`}
              onPress={() => {
                ReactNativeHapticFeedback.trigger('effectTick', {
                  enableVibrateFallback: true,
                  ignoreAndroidSystemSettings: false,
                });
                if (ExcludedQualities.includes(quality)) {
                  setExcludedQualities(prev => prev.filter(q => q !== quality));
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

      {/* clear cache */}
      <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
        <Text className="text-white font-semibold">Clear Cache</Text>
        <TouchableOpacity
          className="bg-[#343434] p-2 rounded-md"
          onPress={() => {
            ReactNativeHapticFeedback.trigger('virtualKey', {
              enableVibrateFallback: true,
              ignoreAndroidSystemSettings: false,
            });
            MmmkvCache.clearStore();
          }}>
          <Text className="text-white rounded-md px-2">Clear</Text>
        </TouchableOpacity>
      </View>
      {/* About */}
      <TouchableNativeFeedback
        onPress={() => {
          navigation.navigate('About');
        }}
        background={TouchableNativeFeedback.Ripple('gray', false)}>
        <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
          <Text className="text-white font-semibold my-2">About</Text>
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

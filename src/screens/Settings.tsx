import {
  View,
  Text,
  TextInput,
  Switch,
  Alert,
  Linking,
  TouchableOpacity,
  TouchableNativeFeedback,
  ToastAndroid,
} from 'react-native';
import React from 'react';
import {MMKV} from '../App';
import {useState} from 'react';
import {MmmkvCache} from '../App';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import pkg from '../../package.json';
import useContentStore from '../lib/zustand/contentStore';

const Settings = () => {
  const [BaseUrl, setBaseUrl] = useState(MMKV.getString('baseUrl') || '');
  const [OpenVlc, setOpenVlc] = useState(MMKV.getBool('vlc') || false);
  const [UseCustomUrl, setUseCustomUrl] = useState(
    MMKV.getBool('UseCustomUrl') || false,
  );
  const [ExcludedQualities, setExcludedQualities] = useState(
    MMKV.getArray('ExcludedQualities') || [],
  );
  const [updateLoading, setUpdateLoading] = useState(false);

  const {contentType, setContentType} = useContentStore(state => state);

  // handle base url change
  const onChange = async (text: string) => {
    if (text.endsWith('/')) {
      text = text.slice(0, -1);
    }
    MMKV.setString('baseUrl', text);
    setBaseUrl(text);
  };

  // handle check for update
  const checkForUpdate = async () => {
    setUpdateLoading(true);
    try {
      const res = await fetch(
        'https://api.github.com/repos/Zenda-Cross/vega-app/releases/latest',
      );
      const data = await res.json();
      if (data.tag_name.replace('v', '') !== pkg.version) {
        ToastAndroid.show('New update available', ToastAndroid.SHORT);
        const url = data.html_url;
        Alert.alert('Update', data.body, [
          {text: 'Cancel'},
          {text: 'Update', onPress: () => Linking.openURL(url)},
        ]);
        console.log('version', data.tag_name.replace('v', ''), pkg.version);
      } else {
        ToastAndroid.show('App is up to date', ToastAndroid.SHORT);
        console.log('version', data.tag_name.replace('v', ''), pkg.version);
      }
    } catch (error) {
      ToastAndroid.show('Failed to check for update', ToastAndroid.SHORT);
      console.log('Update error', error);
    }
    setUpdateLoading(false);
  };

  return (
    <View className="w-full h-full bg-black p-4">
      <Text className="text-2xl font-bold text-white mt-7">Settings</Text>

      {/* use custom base URL */}
      <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
        <Text className="text-white font-semibold">use custom base URL</Text>
        <Switch
          thumbColor={UseCustomUrl ? 'tomato' : 'gray'}
          value={UseCustomUrl}
          onValueChange={val => {
            MMKV.setBool('UseCustomUrl', val);
            setUseCustomUrl(val);
          }}
        />
      </View>

      {/* Base URL */}
      {UseCustomUrl && (
        <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
          <Text className="text-white font-semibold">Base Url</Text>
          <TextInput
            className="bg-secondary text-white p-1 px-2 rounded-md"
            placeholder="example-https://vegamovies.cash"
            value={BaseUrl}
            onChangeText={onChange}
          />
        </View>
      )}

      {/* open in vlc */}
      <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
        <Text className="text-white font-semibold">
          Open video in VLC player
        </Text>
        <Switch
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
        />
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
          className="bg-secondary p-2 rounded-md"
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

      {/* Content type */}
      {!UseCustomUrl && (
        <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
          <Text className="text-white font-semibold">Preferred content</Text>
          <TouchableOpacity
            className="bg-primary/70 p-2 rounded-md"
            onPress={() => {
              ReactNativeHapticFeedback.trigger('virtualKey', {
                enableVibrateFallback: true,
                ignoreAndroidSystemSettings: false,
              });
              setContentType(contentType === 'global' ? 'indian' : 'global');
            }}>
            <Text className="text-white rounded-md px-2 capitalize">
              {contentType === 'global' ? 'Global' : 'Indian'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* version */}
      <TouchableNativeFeedback
        onPress={checkForUpdate}
        disabled={updateLoading}
        background={TouchableNativeFeedback.Ripple('gray', false)}>
        <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
          <Text className="text-white font-semibold my-2">
            Check for Updates
          </Text>
          <Text className="text-white font-semibold my-2">v{pkg.version}</Text>
        </View>
      </TouchableNativeFeedback>
    </View>
  );
};

export default Settings;

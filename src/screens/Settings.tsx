import {
  View,
  Text,
  TextInput,
  Switch,
  // TouchableOpacity,
  Alert,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import React from 'react';
import {MMKV} from '../App';
import {useState} from 'react';
import {MmmkvCache} from '../App';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const Settings = () => {
  const [BaseUrl, setBaseUrl] = useState(
    MMKV.getString('baseUrl') || 'https://vegamovies.cash',
  );
  const [OpenVlc, setOpenVlc] = useState(MMKV.getBool('vlc') || false);
  const [UseCustomUrl, setUseCustomUrl] = useState(
    MMKV.getBool('UseCustomUrl') || false,
  );
  const [ExcludedQualities, setExcludedQualities] = useState(
    MMKV.getArray('ExcludedQualities') || [],
  );

  const onChange = async (text: string) => {
    if (text.endsWith('/')) {
      text = text.slice(0, -1);
    }
    MMKV.setString('baseUrl', text);
    setBaseUrl(text);
  };
  console.log(ExcludedQualities);

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
      <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
        <Text className="text-white font-semibold">
          Open video in VLC player
        </Text>
        <Switch
          thumbColor={OpenVlc ? 'tomato' : 'gray'}
          value={OpenVlc}
          onValueChange={val => {
            MMKV.setBool('vlc', val);
            setOpenVlc(val);
            if (val) {
              Alert.alert(
                'VLC player',
                'Please make sure you have VLC player installed on your device',
                [{text: 'OK'}],
                {cancelable: false},
              );
            }
          }}
        />
      </View>
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
    </View>
  );
};

export default Settings;

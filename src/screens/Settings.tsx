import {View, Text, TextInput} from 'react-native';
import React from 'react';
import {MMKV} from '../App';
import {useLayoutEffect, useState} from 'react';

const Settings = () => {
  const [BaseUrl, setBaseUrl] = useState('');
  const onChange = async (text: string) => {
    if (text.endsWith('/')) {
      text = text.slice(0, -1);
    }
    await MMKV.setString('baseUrl', text);
    setBaseUrl(text);
  };
  useLayoutEffect(() => {
    const fetchBaseUrl = async () => {
      const baseUrl =
        (await MMKV.getString('baseUrl')) || 'https://vegamovies.earth';
      setBaseUrl(baseUrl);
    };
    fetchBaseUrl();
  }, []);
  return (
    <View className="w-full h-full bg-black p-4">
      <Text className="text-2xl font-bold text-white">Settings</Text>
      <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
        <Text className="text-white font-semibold">Base Url</Text>
        <TextInput
          className="bg-secondary text-white p-1 px-2 rounded-md"
          placeholder="example-https://vegamovies.earth"
          value={BaseUrl}
          onChangeText={onChange}
        />
      </View>
    </View>
  );
};

export default Settings;

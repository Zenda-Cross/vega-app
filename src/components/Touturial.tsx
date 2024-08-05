import {View, Text, Modal, Pressable} from 'react-native';
import React from 'react';
import {MMKV} from '../lib/Mmkv';
import {useState} from 'react';
import {providersList} from '../lib/constants';
import useContentStore from '../lib/zustand/contentStore';

const Touturial = () => {
  const [showTouturial, setShowTouturial] = useState<boolean>(
    MMKV.getBool('showTouturial') ?? true,
  );
  const {setProvider} = useContentStore(state => state);
  return (
    showTouturial && (
      <View className="bg-black/50 w-full h-full flex items-center">
        <Modal animationType="fade" visible={true} transparent={true}>
          <View className=" flex items-center">
            <Text className="text-white text-xl my-10">
              Select a provider to start watching
            </Text>
            <View className="flex justify-around flex-wrap h-[500px]">
              {providersList.map(provider => (
                <Pressable
                  key={provider.value}
                  className="bg-quaternary p-3 m-3 flex items-center flex-row rounded-md"
                  onPress={() => {
                    setProvider(provider);
                    MMKV.setBool('showTouturial', false);
                    setShowTouturial(false);
                  }}>
                  <Text className="text-white mr-3">{provider.flag}</Text>
                  <Text className="text-white">{provider.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Modal>
      </View>
    )
  );
};

export default Touturial;

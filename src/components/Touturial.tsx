import {View, Text, Modal, Pressable, ScrollView} from 'react-native';
import React from 'react';
import {MMKV} from '../lib/Mmkv';
import {useState} from 'react';
import {providersList} from '../lib/constants';
import useContentStore from '../lib/zustand/contentStore';
import {SvgUri} from 'react-native-svg';

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
            <Text className="text-white text-xl my-7 font-semibold">
              Select a provider to start watching
            </Text>
            <View className="h-[85%]">
              <ScrollView
                contentContainerStyle={{
                  display: 'flex',
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-around',
                  width: 384,
                  height: 'auto',
                }}>
                {providersList.map(provider => (
                  <Pressable
                    key={provider.value}
                    className="bg-quaternary p-3 m-3 w-[130px] flex items-center rounded-md flex-row"
                    onPress={() => {
                      setProvider(provider);
                      MMKV.setBool('showTouturial', false);
                      setShowTouturial(false);
                    }}>
                    <SvgUri width="27" height="24" uri={provider.flag} />
                    <Text className="text-white ml-2">{provider.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    )
  );
};

export default Touturial;

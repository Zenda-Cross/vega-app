import {View, Text, Modal, Pressable, ScrollView, StatusBar} from 'react-native';
import React from 'react';
import {MMKV} from '../lib/Mmkv';
import {useState} from 'react';
import {providersList} from '../lib/constants';
import useContentStore from '../lib/zustand/contentStore';
import {SvgUri} from 'react-native-svg';
import Animated, { FadeInRight, Layout } from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';

const Touturial = () => {
  const {setProvider, provider: currentProvider} = useContentStore(state => state);
  const [showTouturial, setShowTouturial] = useState<boolean>(
    MMKV.getBool('showTouturial') ?? true
  );

  // Handle default provider setup
  React.useEffect(() => {
    if (MMKV.getBool('showTouturial') === undefined) {
      const vegaProvider = providersList.find(p => p.name === 'Vega Movie');
      if (vegaProvider) {
        setProvider(vegaProvider);
        MMKV.setBool('showTouturial', false);
        setShowTouturial(false);
      }
    }
  }, []);

  // Handle status bar color
  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBackgroundColor('#121212');
      StatusBar.setBarStyle('light-content');
      
      return () => {
        StatusBar.setBackgroundColor('#121212');  
        StatusBar.setBarStyle('light-content');
      };
    }, [])
  );

  return (
    showTouturial && (
      <View className="absolute inset-0 z-50">
        <View className="absolute inset-0 bg-[#121212]" />
        <Modal 
          animationType="fade" 
          visible={true}
          transparent={true}
          statusBarTranslucent={true}
          onRequestClose={() => {}}
        >
          <View className="flex-1 bg-[#121212]">
            <View className="px-6 pt-12 pb-6">
              <Text className="text-white text-2xl font-bold">
                Choose Provider
              </Text>
              <Text className="text-gray-400 mt-2 text-base">
                Select your streaming service to continue
              </Text>
            </View>

            <ScrollView 
              className="flex-1 px-4"
              showsVerticalScrollIndicator={false}>
              {providersList.map((provider, index) => {
                const isSelected = currentProvider?.value === provider.value;
                return (
                  <Animated.View
                    key={provider.value}
                    entering={FadeInRight.delay(index * 100).springify()}
                    layout={Layout.springify()}>
                    <Pressable
                      className={`mb-3 rounded-xl p-3 flex-row items-center border
                        ${isSelected 
                          ? 'bg-[#FF6B00]/10 border-[#FF6B00]' 
                          : 'bg-[#1E1E1E] border-gray-800'
                        }`}
                      onPress={() => {
                        setProvider(provider);
                        MMKV.setBool('showTouturial', false);
                        setShowTouturial(false);
                      }}>
                      <View className={`p-2 rounded-lg ${
                        isSelected ? 'bg-[#FF6B00]/20' : 'bg-[#2A2A2A]'
                      }`}>
                        <SvgUri width="24" height="24" uri={provider.flag} />
                      </View>
                      <Text className="text-white text-base font-medium ml-3 flex-1">
                        {provider.name}
                      </Text>
                      {isSelected ? (
                        <View className="bg-[#FF6B00] p-1 rounded-full">
                          <Text className="text-white">✓</Text>
                        </View>
                      ) : (
                        <Text className="text-gray-400 text-base">→</Text>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
              <View className="h-6" />
            </ScrollView>
          </View>
        </Modal>
      </View>
    )
  );
};

export default Touturial;

import {View, Text} from 'react-native';
import React from 'react';
import useContentStore from '../lib/zustand/contentStore';
import {providersList} from '../lib/constants';
import {ScrollView} from 'moti';
import useThemeStore from '../lib/zustand/themeStore';
import {TouchableOpacity} from 'react-native';
import {DrawerLayout} from 'react-native-gesture-handler';
import {BlurView} from 'expo-blur';
import {Ionicons} from '@expo/vector-icons';
import {SvgUri} from 'react-native-svg';

const ProviderDrawer = ({
  drawerRef,
}: {
  drawerRef: React.RefObject<DrawerLayout>;
}) => {
  const {provider, setProvider} = useContentStore(state => state);
  const {primary} = useThemeStore(state => state);

  return (
    <BlurView
      intensity={90}
      experimentalBlurMethod="dimezisBlurView"
      // renderToHardwareTextureAndroid={true}
      blurReductionFactor={5}
      tint="dark"
      className="px-3">
      <View className="mt-6 p-2 flex flex-row justify-center items-center gap-x-3">
        <Ionicons name="extension-puzzle-outline" size={24} color={primary} />
        <Text className="text-white text-2xl">Providers</Text>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="mb-20 flex gap-[0.8]">
        {providersList.map(item => (
          <TouchableOpacity
            key={item.value}
            onPress={() => {
              setProvider(item);
              drawerRef.current?.closeDrawer();
            }}
            className={`text-white w-44 flex-row justify-start gap-2 items-center px-3 py-1 rounded-s-md border-b border-white/10 rounded-md ${
              provider.value === item.value ? 'bg-white/10' : ''
            } `}>
            <SvgUri className="mb-2" width={20} height={20} uri={item.flag} />
            <Text className=" text-white mb-2">
              {/* {item.flag} */}
              {/* &nbsp; &nbsp; */}
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
        <View className="h-16" />
      </ScrollView>
    </BlurView>
  );
};

export default ProviderDrawer;

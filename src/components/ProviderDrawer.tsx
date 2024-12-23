import {View, Text} from 'react-native';
import React from 'react';
import useContentStore from '../lib/zustand/contentStore';
import {providersList} from '../lib/constants';
import {ScrollView} from 'moti';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import useThemeStore from '../lib/zustand/themeStore';
import {TouchableOpacity} from 'react-native';
import {DrawerLayout} from 'react-native-gesture-handler';

const ProviderDrawer = ({
  drawerRef,
}: {
  drawerRef: React.RefObject<DrawerLayout>;
}) => {
  const {provider, setProvider} = useContentStore(state => state);
  const {primary} = useThemeStore(state => state);

  return (
    <View className="px-3">
      <View className="mt-6 p-2 flex flex-row justify-center items-center gap-x-3">
        <MaterialIcons name="extension" size={24} color={primary} />
        <Text className="text-white text-2xl">Providers</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} className="mb-20">
        {providersList.map(item => (
          <TouchableOpacity
            key={item.value}
            onPress={() => {
              setProvider(item);
              drawerRef.current?.closeDrawer();
            }}
            className={`bg-black text-white w-48 flex-row justify-start gap-2 items-center px-4 py-1 rounded-s-md border-b border-white/10 border rounded-md ${
              provider.value === item.value ? 'bg-quaternary' : ''
            } ${item.value === 'lux' ? 'pb-1' : 'pb-3'}`}>
            <Text className=" text-white mb-2">
              {item.flag}
              &nbsp; &nbsp;
              {item.name}
            </Text>
          </TouchableOpacity>
        ))}
        <View className="h-16" />
      </ScrollView>
    </View>
  );
};

export default ProviderDrawer;

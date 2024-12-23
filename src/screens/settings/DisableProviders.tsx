import {View, Text, Switch, ScrollView} from 'react-native';
import React from 'react';
import {MMKV} from '../../lib/Mmkv';
import {providersList} from '../../lib/constants';
import useThemeStore from '../../lib/zustand/themeStore';

const DisableProviders = () => {
  const {primary} = useThemeStore(state => state);
  const [disabledProviders, setDisabledProviders] = React.useState<string[]>(
    MMKV.getArray('disabledProviders') || [],
  );
  console.log(disabledProviders);
  return (
    <ScrollView className="w-full h-full bg-black">
      <Text className="text-white mt-10 ml-4 font-bold text-2xl">
        Disable Providers
      </Text>
      <Text className="text-xs text-white ml-4">
        Disabled providers won't show in search results
      </Text>
      <View className="mt-2 p-2">
        {providersList.map((provider, index) => (
          <View
            key={provider.value}
            className="flex-row items-center px-4 justify-between mt-3 bg-tertiary p-2 rounded-md">
            <Text className="text-white font-semibold">{provider.name}</Text>
            <View className="w-20" />
            <Switch
              thumbColor={
                disabledProviders?.includes(provider.value) ? primary : 'gray'
              }
              value={disabledProviders?.includes(provider.value)}
              onValueChange={
                // @ts-ignore
                () => {
                  if (disabledProviders?.includes(provider.value)) {
                    const newDisabledProviders = disabledProviders.filter(
                      item => item !== provider.value,
                    );
                    setDisabledProviders(newDisabledProviders);
                    MMKV.setArray('disabledProviders', newDisabledProviders);
                  } else {
                    const newDisabledProviders = [...disabledProviders];
                    newDisabledProviders.push(provider.value);
                    setDisabledProviders(newDisabledProviders);
                    MMKV.setArray('disabledProviders', newDisabledProviders);
                  }
                }
              }
            />
          </View>
        ))}
      </View>
      <View className="h-16" />
    </ScrollView>
  );
};

export default DisableProviders;

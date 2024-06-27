import {View, Text, Switch} from 'react-native';
import React from 'react';
import {MMKV} from '../../lib/Mmkv';
import {providersList} from '../../lib/constants';

const DisableProviders = () => {
  const [disabledProviders, setDisabledProviders] = React.useState<string[]>(
    MMKV.getArray('disabledProviders') || [],
  );
  console.log(disabledProviders);
  return (
    <View className="w-full h-full bg-black">
      <Text className="text-white mt-8 ml-4 font-bold text-2xl">
        Disable Providers
      </Text>
      <Text className="text-xs text-white mt-2 ml-4">
        Disabled providers won't show in search results
      </Text>
      <View className="mt-4 p-2">
        {providersList.map((provider, index) => (
          <View
            key={provider.value}
            className="flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
            <Text className="text-white font-semibold">{provider.name}</Text>
            <View className="w-20"></View>
            <Switch
              thumbColor={
                disabledProviders?.includes(provider.value) ? 'tomato' : 'gray'
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
    </View>
  );
};

export default DisableProviders;

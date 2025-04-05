import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  TouchableNativeFeedback,
} from 'react-native';
import React from 'react';
import {startActivityAsync, ActivityAction} from 'expo-intent-launcher';
import {ScrollView} from 'moti';
import {MMKV} from '../../lib/Mmkv';
import useThemeStore from '../../lib/zustand/themeStore';
import {Feather, Entypo} from '@expo/vector-icons';
const SubtitlePreference = () => {
  const [fontSize, setFontSize] = React.useState(
    MMKV.getInt('subtitleOpacity') || 16,
  );
  const [opacity, setOpacity] = React.useState(
    MMKV.getInt('subtitleOpacity') || 1,
  );
  const [bottomElevation, setBottomElevation] = React.useState(
    MMKV.getInt('subtitleBottomPadding') || 10,
  );
  const {primary} = useThemeStore();

  const handleSubtitleSize = (action: 'increase' | 'decrease') => {
    if (fontSize < 5 || fontSize > 30) return;
    if (action === 'increase') {
      MMKV.setInt('subtitleFontSize', fontSize + 1);
      setFontSize(prev => Math.min(prev + 1, 30));
    }
    if (action === 'decrease') {
      MMKV.setInt('subtitleFontSize', fontSize - 1);
      setFontSize(prev => Math.max(prev - 1, 10));
    }
  };

  const handleSubtitleOpacity = (action: 'increase' | 'decrease') => {
    if (action === 'increase') {
      const newOpacity = Math.min(opacity + 0.1, 1).toFixed(1);
      MMKV.setString('subtitleOpacity', newOpacity);
      setOpacity(parseFloat(newOpacity));
    }
    if (action === 'decrease') {
      const newOpacity = Math.max(opacity - 0.1, 0).toFixed(1);
      MMKV.setString('subtitleOpacity', newOpacity);
      setOpacity(parseFloat(newOpacity));
    }
  };

  const handleSubtitleBottomPadding = (action: 'increase' | 'decrease') => {
    if (bottomElevation < 0 || bottomElevation > 50) return;
    if (action === 'increase') {
      MMKV.setInt('subtitleBottomPadding', bottomElevation + 1);
      setBottomElevation(prev => Math.min(prev + 1, 30));
    }
    if (action === 'decrease') {
      MMKV.setInt('subtitleBottomPadding', bottomElevation - 1);
      setBottomElevation(prev => Math.max(prev - 1, 0));
    }
  };

  return (
    <ScrollView
      className="w-full h-full bg-black"
      contentContainerStyle={{
        paddingTop: StatusBar.currentHeight || 0,
      }}>
      <View className="p-5">
        <Text className="text-2xl font-bold text-white mb-6">
          Subtitle Preferences
        </Text>

        <View className="bg-[#1A1A1A] rounded-xl overflow-hidden">
          <View className="flex-row items-center justify-between p-4 border-b border-[#262626]">
            <Text className="text-white text-base">Subtitle Font Size</Text>
            <View className="flex-row items-center gap-4">
              <TouchableOpacity onPress={() => handleSubtitleSize('decrease')}>
                <Entypo name="minus" size={23} color={primary} />
              </TouchableOpacity>
              <Text className="text-white text-base bg-[#262626] px-3 rounded-md w-12 text-center">
                {fontSize}
              </Text>
              <TouchableOpacity onPress={() => handleSubtitleSize('increase')}>
                <Entypo name="plus" size={23} color={primary} />
              </TouchableOpacity>
            </View>
          </View>
          {/* opacity */}
          <View className="flex-row items-center justify-between p-4 border-b border-[#262626]">
            <Text className="text-white text-base">Subtitle Opacity</Text>
            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                onPress={() => handleSubtitleOpacity('decrease')}>
                <Entypo name="minus" size={23} color={primary} />
              </TouchableOpacity>
              <Text className="text-white text-base bg-[#262626] px-3 rounded-md w-12 text-center">
                {opacity}
              </Text>
              <TouchableOpacity
                onPress={() => handleSubtitleOpacity('increase')}>
                <Entypo name="plus" size={23} color={primary} />
              </TouchableOpacity>
            </View>
          </View>
          {/* bottom padding */}
          <View className="flex-row items-center justify-between p-4 border-b border-[#262626]">
            <Text className="text-white text-base">Subtitle Elevation</Text>
            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                onPress={() => handleSubtitleBottomPadding('decrease')}>
                <Entypo name="minus" size={23} color={primary} />
              </TouchableOpacity>
              <Text className="text-white text-base bg-[#262626] px-3 rounded-md w-12 text-center">
                {bottomElevation}
              </Text>
              <TouchableOpacity
                onPress={() => handleSubtitleBottomPadding('increase')}>
                <Entypo name="plus" size={23} color={primary} />
              </TouchableOpacity>
            </View>
          </View>
          {/* More Settings */}
          <TouchableNativeFeedback
            onPress={async () => {
              await startActivityAsync(ActivityAction.CAPTIONING_SETTINGS);
            }}
            background={TouchableNativeFeedback.Ripple('#333333', false)}>
            <View className="flex-row items-center justify-between p-4 border-b border-[#262626]">
              <View className="flex-row items-center">
                <Text className="text-white text-base">
                  More Subtitle Settings
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color="gray" />
            </View>
          </TouchableNativeFeedback>

          {/* reset */}
          <View className="flex-row items-center justify-between p-4 border-b border-[#262626]">
            <Text className="text-white text-base">Reset to Default</Text>
            <TouchableOpacity
              onPress={() => {
                MMKV.setInt('subtitleFontSize', 16);
                MMKV.setInt('subtitleOpacity', 1);
                MMKV.setInt('subtitleBottomPadding', 10);
                setFontSize(16);
                setOpacity(1);
                setBottomElevation(10);
              }}>
              <View className="w-32 flex-row items-center justify-center">
                <Text className="text-white text-base bg-[#262626] px-3 py-1 rounded-md text-center">
                  Reset
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <View className="h-16" />
      </View>
    </ScrollView>
  );
};

export default SubtitlePreference;

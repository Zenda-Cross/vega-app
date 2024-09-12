import {
  View,
  Text,
  Switch,
  ScrollView,
  TouchableOpacity,
  ToastAndroid,
} from 'react-native';
import React, {useState} from 'react';
import {MMKV} from '../../lib/Mmkv';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import RNReactNativeHapticFeedback from 'react-native-haptic-feedback';
import useWatchHistoryStore from '../../lib/zustand/watchHistrory';
import useThemeStore from '../../lib/zustand/themeStore';
import {Dropdown} from 'react-native-element-dropdown';
import {themes} from '../../lib/constants';
import {TextInput} from 'react-native';

const Preferences = () => {
  const {primary, setPrimary, isCustom, setCustom} = useThemeStore(
    state => state,
  );
  const [showRecentlyWatched, setShowRecentlyWatched] = useState(
    MMKV.getBool('showRecentlyWatched') || false,
  );
  const [disableDrawer, setDisableDrawer] = useState(
    MMKV.getBool('disableDrawer') || false,
  );
  const {clearHistory} = useWatchHistoryStore(state => state);

  const [ExcludedQualities, setExcludedQualities] = useState(
    MMKV.getArray('ExcludedQualities') || [],
  );

  const [customColor, setCustomColor] = useState(
    MMKV.getString('customColor') || '#FF6347',
  );

  const [showMediaControls, setShowMediaControls] = useState<boolean>(
    MMKV.getBool('showMediaControls') || true,
  );

  const [showHamburgerMenu, setShowHamburgerMenu] = useState<boolean>(
    MMKV.getBool('showHamburgerMenu') || false,
  );

  return (
    <ScrollView className="w-full h-full bg-black">
      <Text className="text-white mt-10 ml-4 font-bold text-2xl">
        Preference
      </Text>

      <View className="mt-2 p-2">
        {/* Themes */}
        <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
          <Text className="text-white font-semibold">Themes</Text>
          {isCustom ? (
            <View className="w-36 flex-row items-center justify-around">
              <TextInput
                style={{
                  color: 'white',
                  backgroundColor: '#343434',
                  borderRadius: 5,
                  padding: 5,
                }}
                placeholder="Hex Color"
                placeholderTextColor="gray"
                value={customColor}
                onChangeText={e => {
                  setCustomColor(e);
                }}
                onSubmitEditing={(e: any) => {
                  if (e.nativeEvent.text.length < 7) {
                    ToastAndroid.show('Invalid Color', ToastAndroid.SHORT);
                    return;
                  }
                  MMKV.setString('customColor', e.nativeEvent.text);
                  setPrimary(e.nativeEvent.text);
                }}
              />
              <MaterialCommunityIcons
                name="close"
                size={24}
                color="white"
                onPress={() => {
                  setCustom(false);
                  setPrimary('#FF6347');
                }}
              />
            </View>
          ) : (
            <View className="w-28">
              <Dropdown
                selectedTextStyle={{
                  color: 'white',
                  overflow: 'hidden',
                  fontWeight: 'bold',
                  height: 23,
                }}
                containerStyle={{
                  borderColor: '#363636',
                  width: 100,
                  borderRadius: 5,
                  overflow: 'hidden',
                  padding: 2,
                  backgroundColor: 'black',
                  maxHeight: 450,
                }}
                labelField="name"
                valueField="color"
                renderItem={item => {
                  return (
                    <View
                      className={`bg-black font-extrabold text-white w-48 flex-row justify-start gap-2 items-center px-4 py-1 border border-b border-white/10 rounded-md ${
                        primary === item.color ? 'bg-quaternary' : ''
                      }
                        ${item.name === 'Custom' ? 'pb-1' : 'pb-3'}
                      `}>
                      <Text
                        style={{color: item.color}}
                        className="mb-2 font-bold">
                        {item.name}
                      </Text>
                    </View>
                  );
                }}
                data={themes}
                value={primary}
                onChange={value => {
                  if (value.name === 'Custom') {
                    setCustom(true);
                    setPrimary(customColor);
                    return;
                  }
                  setPrimary(value.color);
                }}
              />
            </View>
          )}
        </View>

        {/* disable drawer */}
        <View className="flex-row items-center px-4 justify-between mt-5 bg-tertiary p-3 rounded-md">
          <Text className="text-white font-semibold">
            Disable Drawer at Home Screen
          </Text>
          <View className="w-20" />
          <Switch
            thumbColor={disableDrawer ? primary : 'gray'}
            value={disableDrawer}
            onValueChange={() => {
              MMKV.setBool('disableDrawer', !disableDrawer);
              setDisableDrawer(!disableDrawer);
            }}
          />
        </View>

        {/* show hamburger menu */}
        {!disableDrawer && (
          <View className="flex-row items-center px-4 justify-between mt-5 bg-tertiary p-3 rounded-md">
            <Text className="text-white font-semibold">
              Show Hamburger Menu
            </Text>
            <View className="w-20" />
            <Switch
              thumbColor={showHamburgerMenu ? primary : 'gray'}
              value={showHamburgerMenu}
              onValueChange={() => {
                MMKV.setBool('showHamburgerMenu', !showHamburgerMenu);
                setShowHamburgerMenu(!showHamburgerMenu);
                ToastAndroid.show(
                  'Restart App to Apply Changes',
                  ToastAndroid.SHORT,
                );
              }}
            />
          </View>
        )}

        {/* show media controls */}
        <View className="flex-row items-center px-4 justify-between mt-5 bg-tertiary p-3 rounded-md">
          <Text className="text-white font-semibold">
            Show Video Controls in Notification
          </Text>
          <View className="w-20" />
          <Switch
            thumbColor={showMediaControls ? primary : 'gray'}
            value={showMediaControls}
            onValueChange={() => {
              MMKV.setBool('showMediaControls', !showMediaControls);
              setShowMediaControls(!showMediaControls);
            }}
          />
        </View>

        {/* show recentlyWatched */}
        <View className="flex-row items-center px-4 justify-between mt-5 bg-tertiary p-3 rounded-md">
          <Text className="text-white font-semibold">
            Show Recently Watched
          </Text>
          <View className="w-20" />
          <Switch
            thumbColor={showRecentlyWatched ? primary : 'gray'}
            value={showRecentlyWatched}
            onValueChange={() => {
              MMKV.setBool('showRecentlyWatched', !showRecentlyWatched);
              setShowRecentlyWatched(!showRecentlyWatched);
              ToastAndroid.show(
                'Restart App to Apply Changes',
                ToastAndroid.SHORT,
              );
            }}
          />
        </View>

        {/* clear watch history */}
        <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
          <Text className="text-white font-semibold">Clear Watch History</Text>
          <TouchableOpacity
            className="bg-[#343434] w-12 items-center p-2 rounded-md"
            onPress={() => {
              RNReactNativeHapticFeedback.trigger('virtualKey', {
                enableVibrateFallback: true,
                ignoreAndroidSystemSettings: false,
              });
              clearHistory();
            }}>
            <MaterialCommunityIcons
              name="delete-outline"
              size={20}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* Excluded qualities */}
        <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
          <Text className="text-white font-semibold">Excluded qualities</Text>
          <View className="flex flex-row flex-wrap">
            {['360p', '480p', '720p'].map((quality, index) => (
              <TouchableOpacity
                key={index}
                className={'bg-secondary p-2 rounded-md m-1'}
                style={{
                  backgroundColor: ExcludedQualities.includes(quality)
                    ? primary
                    : '#343434',
                }}
                onPress={() => {
                  RNReactNativeHapticFeedback.trigger('effectTick', {
                    enableVibrateFallback: true,
                    ignoreAndroidSystemSettings: false,
                  });
                  if (ExcludedQualities.includes(quality)) {
                    setExcludedQualities(prev =>
                      prev.filter(q => q !== quality),
                    );
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
      </View>
    </ScrollView>
  );
};

export default Preferences;

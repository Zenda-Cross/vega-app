import React, {useEffect} from 'react';
import Home from './screens/home/Home';
import Info from './screens/home/Info';
import Player from './screens/home/Player';
import Settings from './screens/settings/Settings';
import WatchList from './screens/WatchList';
import Search from './screens/Search';
import ScrollList from './screens/ScrollList';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Ionicons from '@expo/vector-icons/Ionicons';
import Entypo from '@expo/vector-icons/Entypo';
import 'react-native-reanimated';
import 'react-native-gesture-handler';
import WebView from './screens/WebView';
import SearchResults from './screens/SearchResults';
import * as SystemUI from 'expo-system-ui';
import DisableProviders from './screens/settings/DisableProviders';
import About, {checkForUpdate} from './screens/settings/About';
import {MMKV} from './lib/Mmkv';
import BootSplash from 'react-native-bootsplash';
import {enableFreeze, enableScreens} from 'react-native-screens';
import Preferences from './screens/settings/Preference';
import useThemeStore from './lib/zustand/themeStore';
import {LogBox, ViewStyle} from 'react-native';
import {EpisodeLink} from './lib/providers/types';
import RNReactNativeHapticFeedback from 'react-native-haptic-feedback';
import TabBarBackgound from './components/TabBarBackgound';
import {TouchableOpacity} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {StyleProp} from 'react-native';
import Animated from 'react-native-reanimated';
import Downloads from './screens/settings/Downloads';

enableScreens(true);
enableFreeze(true);

export type HomeStackParamList = {
  Home: undefined;
  Info: {link: string; provider?: string; poster?: string};
  ScrollList: {
    filter: string;
    title?: string;
    providerValue?: string;
    isSearch: boolean;
  };
  Webview: {link: string};
};

export type RootStackParamList = {
  TabStack: undefined;
  Player: {
    linkIndex: number;
    episodeList: EpisodeLink[];
    directUrl?: string;
    type: string;
    primaryTitle?: string;
    secondaryTitle?: string;
    poster: {
      logo?: string;
      poster?: string;
      background?: string;
    };
    file?: string;
    providerValue?: string;
  };
};

export type SearchStackParamList = {
  Search: undefined;
  ScrollList: {
    filter: string;
    title?: string;
    providerValue?: string;
    isSearch: boolean;
  };
  Info: {link: string; provider?: string; poster?: string};
  SearchResults: {filter: string};
};

export type WatchListStackParamList = {
  WatchList: undefined;
  Info: {link: string; provider?: string; poster?: string};
};

export type SettingsStackParamList = {
  Settings: undefined;
  DisableProviders: undefined;
  About: undefined;
  Preferences: undefined;
  Downloads: undefined;
};

export type TabStackParamList = {
  HomeStack: undefined;
  SearchStack: undefined;
  WatchListStack: undefined;
  SettingsStack: undefined;
};
const Tab = createBottomTabNavigator<TabStackParamList>();
const App = () => {
  LogBox.ignoreLogs(['You have passed a style to FlashList']);
  const HomeStack = createNativeStackNavigator<HomeStackParamList>();
  const Stack = createNativeStackNavigator<RootStackParamList>();
  const SearchStack = createNativeStackNavigator<SearchStackParamList>();
  const WatchListStack = createNativeStackNavigator<WatchListStackParamList>();
  const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();
  const {primary} = useThemeStore(state => state);

  const showTabBarLables = MMKV.getBool('showTabBarLables') || false;

  SystemUI.setBackgroundColorAsync('black');

  function HomeStackScreen() {
    return (
      <HomeStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'ios_from_right',
          animationDuration: 200,
          freezeOnBlur: true,
        }}>
        <HomeStack.Screen name="Home" component={Home} />
        <HomeStack.Screen name="Info" component={Info} />
        <HomeStack.Screen name="ScrollList" component={ScrollList} />
        <HomeStack.Screen name="Webview" component={WebView} />
      </HomeStack.Navigator>
    );
  }

  function SearchStackScreen() {
    return (
      <SearchStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'ios_from_right',
          animationDuration: 200,
          freezeOnBlur: true,
        }}>
        <SearchStack.Screen name="Search" component={Search} />
        <SearchStack.Screen name="ScrollList" component={ScrollList} />
        <SearchStack.Screen name="Info" component={Info} />
        <SearchStack.Screen name="SearchResults" component={SearchResults} />
      </SearchStack.Navigator>
    );
  }

  function WatchListStackScreen() {
    return (
      <WatchListStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'ios_from_right',
          animationDuration: 200,
          freezeOnBlur: true,
        }}>
        <WatchListStack.Screen name="WatchList" component={WatchList} />
        <WatchListStack.Screen name="Info" component={Info} />
      </WatchListStack.Navigator>
    );
  }

  function SettingsStackScreen() {
    return (
      <SettingsStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'ios_from_right',
          animationDuration: 200,
          freezeOnBlur: true,
        }}>
        <SettingsStack.Screen name="Settings" component={Settings} />
        <SettingsStack.Screen
          name="DisableProviders"
          component={DisableProviders}
        />
        <SettingsStack.Screen name="About" component={About} />
        <SettingsStack.Screen name="Preferences" component={Preferences} />
        <SettingsStack.Screen name="Downloads" component={Downloads} />
      </SettingsStack.Navigator>
    );
  }
  function TabStack() {
    return (
      <Tab.Navigator
        detachInactiveScreens={true}
        screenOptions={{
          animation: 'shift',
          popToTopOnBlur: true,
          tabBarPosition: 'bottom',
          headerShown: false,
          freezeOnBlur: true,
          tabBarActiveTintColor: primary,
          tabBarInactiveTintColor: '#dadde3',
          tabBarShowLabel: showTabBarLables,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            height: 65,
            borderRadius: 0,
            // backgroundColor: 'rgba(0, 0, 0, 0.8)',
            overflow: 'hidden',
            elevation: 0,
            borderTopWidth: 0,
            paddingHorizontal: 0,
            paddingTop: 5,
          },
          tabBarBackground: () => <TabBarBackgound />,
          tabBarHideOnKeyboard: true,
          tabBarButton: props => {
            return (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityState={props.accessibilityState}
                style={props.style as StyleProp<ViewStyle>}
                onPress={e => {
                  props.onPress && props.onPress(e);
                  if (!props?.accessibilityState?.selected) {
                    RNReactNativeHapticFeedback.trigger('effectTick', {
                      enableVibrateFallback: true,
                      ignoreAndroidSystemSettings: false,
                    });
                  }
                }}>
                {props.children}
              </TouchableOpacity>
            );
          },
        }}>
        <Tab.Screen
          name="HomeStack"
          component={HomeStackScreen}
          options={{
            title: 'Home',
            tabBarIcon: ({focused, color, size}) => (
              <Animated.View
                style={{
                  transform: [{scale: focused ? 1.1 : 1}],
                }}>
                {focused ? (
                  <Ionicons name="home" color={color} size={size} />
                ) : (
                  <Ionicons name="home-outline" color={color} size={size} />
                )}
              </Animated.View>
            ),
          }}
        />
        <Tab.Screen
          name="SearchStack"
          component={SearchStackScreen}
          options={{
            title: 'Search',
            tabBarIcon: ({focused, color, size}) => (
              <Animated.View
                style={{
                  transform: [{scale: focused ? 1.1 : 1}],
                }}>
                {focused ? (
                  <Ionicons name="search" color={color} size={size} />
                ) : (
                  <Ionicons name="search-outline" color={color} size={size} />
                )}
              </Animated.View>
            ),
          }}
        />
        <Tab.Screen
          name="WatchListStack"
          component={WatchListStackScreen}
          options={{
            title: 'Watch List',
            tabBarIcon: ({focused, color, size}) => (
              <Animated.View
                style={{
                  transform: [{scale: focused ? 1.1 : 1}],
                }}>
                {focused ? (
                  <Entypo name="folder-video" color={color} size={size} />
                ) : (
                  <Entypo name="folder-video" color={color} size={size} />
                )}
              </Animated.View>
            ),
          }}
        />
        <Tab.Screen
          name="SettingsStack"
          component={SettingsStackScreen}
          options={{
            title: 'Settings',
            tabBarIcon: ({focused, color, size}) => (
              <Animated.View
                style={{
                  transform: [{scale: focused ? 1.1 : 1}],
                }}>
                {focused ? (
                  <Ionicons name="settings" color={color} size={size} />
                ) : (
                  <Ionicons name="settings-outline" color={color} size={size} />
                )}
              </Animated.View>
            ),
          }}
        />
      </Tab.Navigator>
    );
  }
  useEffect(() => {
    if (MMKV.getBool('autoCheckUpdate') !== false) {
      checkForUpdate(
        () => {},
        MMKV.getBool('autoDownload') || false,
        false,
        primary,
      );
    }
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView
        edges={{left: 'off', right: 'off', top: 'off', bottom: 'additive'}}
        style={{flex: 1}}>
        <NavigationContainer
          onReady={() => BootSplash.hide({fade: true})}
          theme={{
            fonts: {
              regular: {
                fontFamily: 'Inter_400Regular',
                fontWeight: '400',
              },
              medium: {
                fontFamily: 'Inter_500Medium',
                fontWeight: '500',
              },
              bold: {
                fontFamily: 'Inter_700Bold',
                fontWeight: '700',
              },
              heavy: {
                fontFamily: 'Inter_800ExtraBold',
                fontWeight: '800',
              },
            },
            dark: true,
            colors: {
              background: 'transparent',
              card: 'black',
              primary: primary,
              text: 'white',
              border: 'black',
              notification: primary,
            },
          }}>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'ios_from_right',
              animationDuration: 200,
              freezeOnBlur: true,
              contentStyle: {backgroundColor: 'transparent'},
            }}>
            <Stack.Screen name="TabStack" component={TabStack} />
            <Stack.Screen
              options={{
                orientation: 'landscape',
              }}
              name="Player"
              component={Player}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

export default App;

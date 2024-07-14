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
import {SafeAreaProvider} from 'react-native-safe-area-context';
import DisableProviders from './screens/settings/DisableProviders';
import {Alert, Linking} from 'react-native';
import pkg from '../package.json';
import About from './screens/settings/About';
import {MMKV} from './lib/Mmkv';

export type HomeStackParamList = {
  Home: undefined;
  Info: {link: string; provider?: string; poster?: string};
  ScrollList: {filter: string; title?: string; providerValue?: string};
  Webview: {link: string};
};

export type RootStackParamList = {
  TabStack: undefined;
  Player: {
    link: string;
    type: string;
    title: string;
    poster: string;
    file?: string;
    providerValue?: string;
  };
};

export type SearchStackParamList = {
  Search: undefined;
  ScrollList: {filter: string; title?: string; providerValue?: string};
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
};
const Tab = createBottomTabNavigator();
const App = () => {
  const HomeStack = createNativeStackNavigator<HomeStackParamList>();
  const Stack = createNativeStackNavigator<RootStackParamList>();
  const SearchStack = createNativeStackNavigator<SearchStackParamList>();
  const WatchListStack = createNativeStackNavigator<WatchListStackParamList>();
  const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

  SystemUI.setBackgroundColorAsync('black');

  function HomeStackScreen() {
    return (
      <HomeStack.Navigator
        screenOptions={{
          headerShown: false,
          headerBlurEffect: 'light',
          headerTintColor: 'tomato',
          headerStyle: {backgroundColor: '#171717'},
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
          headerBlurEffect: 'light',
          headerTintColor: 'tomato',
          headerStyle: {backgroundColor: '#171717'},
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
          headerBlurEffect: 'light',
          headerTintColor: 'tomato',
          headerStyle: {backgroundColor: '#171717'},
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
          headerBlurEffect: 'light',
          headerTintColor: 'tomato',
          headerStyle: {backgroundColor: '#171717'},
        }}>
        <SettingsStack.Screen name="Settings" component={Settings} />
        <SettingsStack.Screen
          name="DisableProviders"
          component={DisableProviders}
        />
        <SettingsStack.Screen name="About" component={About} />
      </SettingsStack.Navigator>
    );
  }

  function TabStack() {
    return (
      <Tab.Navigator
        detachInactiveScreens={true}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {backgroundColor: 'black'},
          tabBarHideOnKeyboard: true,
        }}>
        <Tab.Screen
          name="HomeStack"
          component={HomeStackScreen}
          options={{
            title: 'Home',
            tabBarIcon: ({focused, color, size}) =>
              focused ? (
                <Ionicons name="home" color={color} size={size} />
              ) : (
                <Ionicons name="home-outline" color={color} size={size} />
              ),
          }}
        />
        <Tab.Screen
          name="SearchStack"
          component={SearchStackScreen}
          options={{
            title: 'Search',
            tabBarIcon: ({focused, color, size}) =>
              focused ? (
                <Ionicons name="search" color={color} size={size} />
              ) : (
                <Ionicons name="search-outline" color={color} size={size} />
              ),
          }}
        />
        <Tab.Screen
          name="Watch List"
          component={WatchListStackScreen}
          options={{
            unmountOnBlur: true,
            tabBarIcon: ({focused, color, size}) =>
              focused ? (
                <Entypo name="folder-video" color={color} size={size} />
              ) : (
                <Entypo name="folder-video" color={color} size={size} />
              ),
          }}
        />
        <Tab.Screen
          name="SettingsStack"
          component={SettingsStackScreen}
          options={{
            title: 'Settings',
            tabBarIcon: ({focused, color, size}) =>
              focused ? (
                <Ionicons name="settings" color={color} size={size} />
              ) : (
                <Ionicons name="settings-outline" color={color} size={size} />
              ),
          }}
        />
      </Tab.Navigator>
    );
  }

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const res = await fetch(
          'https://api.github.com/repos/Zenda-Cross/vega-app/releases/latest',
        );
        const data = await res.json();
        if (data.tag_name.replace('v', '') !== pkg.version) {
          const url = data.html_url;
          Alert.alert('Update', data.body, [
            {text: 'Cancel'},
            {text: 'Update', onPress: () => Linking.openURL(url)},
          ]);
          console.log('version', data.tag_name.replace('v', ''), pkg.version);
        }
      } catch (error) {
        console.log('Update error', error);
      }
    };
    if (MMKV.getBool('autoCheckUpdate') !== false) {
      checkForUpdate();
    }
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            background: 'black',
            card: 'black',
            primary: 'tomato',
            text: 'white',
            border: 'black',
            notification: 'tomato',
          },
        }}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            headerBlurEffect: 'light',
            headerTintColor: 'tomato',
            headerStyle: {backgroundColor: '#171717'},
          }}>
          <Stack.Screen name="TabStack" component={TabStack} />
          <Stack.Screen name="Player" component={Player} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;

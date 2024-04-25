import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import Home from './screens/home/Home';
import Info from './screens/home/Info';
import Settings from './screens/Settings';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Entypo from 'react-native-vector-icons/Entypo';

const Tab = createBottomTabNavigator();

const App = () => {
  const HomeStack = createNativeStackNavigator();

  function HomeStackScreen() {
    return (
      <HomeStack.Navigator
        screenOptions={{
          headerBlurEffect: 'light',
          headerTintColor: 'tomato',
          headerStyle: {backgroundColor: '#171717'},
        }}>
        <HomeStack.Screen name="Home" component={Home} />
        <HomeStack.Screen name="Info" component={Info} />
      </HomeStack.Navigator>
    );
  }

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: 'tomato',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: {backgroundColor: 'black'},
        }}>
        <Tab.Screen
          name="Home"
          component={HomeStackScreen}
          options={{
            tabBarIcon: ({color, size}) => (
              <Entypo name="home" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          name="Settings"
          component={Settings}
          options={{
            tabBarIcon: ({color, size}) => (
              <Entypo name="cog" color={color} size={size} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;

const styles = StyleSheet.create({});

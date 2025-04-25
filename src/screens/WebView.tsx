import {View, Text, SafeAreaView, Linking} from 'react-native';
import React from 'react';
import {WebView} from 'react-native-webview';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../App';
import {MaterialIcons} from '@expo/vector-icons';

type Props = NativeStackScreenProps<HomeStackParamList, 'Webview'>;

const Webview = ({route, navigation}: Props) => {
  return (
    <SafeAreaView className="bg-black w-full h-full">
      <View className="bg-black w-full mt-6 h-16 flex flex-row justify-between p-3 items-center">
        <Text className="text-white text-lg font-bold">Webview</Text>
        <View className="flex flex-row items-center gap-5">
          <MaterialIcons
            name="open-in-browser"
            size={24}
            color="white"
            onPress={() => {
              Linking.openURL(route.params.link);
            }}
          />
          <MaterialIcons
            name="close"
            size={24}
            color="white"
            onPress={() => {
              navigation.goBack();
            }}
          />
        </View>
      </View>
      <WebView
        // javaScriptCanOpenWindowsAutomatically={false}
        javaScriptEnabled={false}
        source={{uri: route.params.link}}
      />
    </SafeAreaView>
  );
};

export default Webview;

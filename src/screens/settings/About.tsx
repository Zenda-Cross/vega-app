import {
  View,
  Text,
  TouchableNativeFeedback,
  ToastAndroid,
  Linking,
  Alert,
  Switch,
} from 'react-native';
import pkg from '../../../package.json';
import React, {useState} from 'react';
import {Feather} from '@expo/vector-icons';
import {MMKV} from '../../lib/Mmkv';
import RNFS from 'react-native-fs';
import notifee, {EventDetail, EventType} from '@notifee/react-native';
import * as IntentLauncher from 'expo-intent-launcher';

async function handleAction({
  type,
  detail,
}: {
  type: EventType;
  detail: EventDetail;
}) {
  console.log('handleAction', type, detail.pressAction?.id);
  if (type === EventType.PRESS && detail.pressAction?.id === 'install') {
    const res = await RNFS.exists(
      `${RNFS.DownloadDirectoryPath}/${detail.notification?.data?.name}`,
    );
    if (res) {
      console.log('installing', detail.notification?.data?.name);
      IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: `file://${RNFS.DownloadDirectoryPath}/${detail.notification?.data?.name}`,
        flags: 1,
        type: 'application/vnd.android.package-archive',
      });
    }
  }
}
notifee.onForegroundEvent(handleAction);
notifee.onBackgroundEvent(handleAction);

const About = () => {
  const [updateLoading, setUpdateLoading] = useState(false);
  const [autoDownload, setAutoDownload] = useState(
    MMKV.getBool('autoDownload') || false,
  );
  const [autoCheckUpdate, setAutoCheckUpdate] = useState(
    MMKV.getBool('autoCheckUpdate') || true,
  );

  // download update
  const downloadUpdate = async (url: string, name: string) => {
    console.log('downloading', url, name);
    await notifee.requestPermission();
    // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: 'download',
      name: 'Download Notifications',
    });
    try {
      if (await RNFS.exists(`${RNFS.DownloadDirectoryPath}/v${name}`)) {
        notifee.displayNotification({
          title: 'Download Complete',
          body: 'Tap to install',
          data: {name},
          android: {
            channelId,
            pressAction: {
              id: 'install',
            },
          },
        });
        return;
      }
    } catch (error) {}
    const {promise, jobId} = RNFS.downloadFile({
      fromUrl: url,
      background: true,
      progressInterval: 1000,
      progressDivider: 1,
      toFile: `${RNFS.DownloadDirectoryPath}/v${name}`,
      begin: res => {
        console.log('begin', res.jobId, res.statusCode, res.headers);
      },
      progress: res => {
        console.log('progress', res.bytesWritten, res.contentLength);
        notifee.displayNotification({
          id: 'downloadUpdate',
          title: 'Downloading Update',
          body: `Version ${pkg.version} -> ${name}`,
          android: {
            channelId,
            onlyAlertOnce: true,
            progress: {
              current: res.bytesWritten,
              max: res.contentLength,
            },
          },
        });
      },
    });
    const Filename = 'v' + name;
    promise.then(async res => {
      if (res.statusCode === 200) {
        notifee.cancelNotification('downloadUpdate');
        notifee.displayNotification({
          title: 'Download Complete',
          body: 'Tap to install',
          data: {Filename},
          android: {
            channelId,
            pressAction: {
              id: 'install',
            },
          },
        });
      }
    });
  };

  // handle check for update
  const checkForUpdate = async () => {
    setUpdateLoading(true);
    try {
      const res = await fetch(
        'https://api.github.com/repos/Zenda-Cross/vega-app/releases/latest',
      );
      const data = await res.json();
      if (data.tag_name.replace('v', '') !== pkg.version) {
        ToastAndroid.show('New update available', ToastAndroid.SHORT);
        Alert.alert('Update', data.body, [
          {text: 'Cancel'},
          {
            text: 'Update',
            onPress: () =>
              autoDownload
                ? downloadUpdate(
                    data.assets[0].browser_download_url,
                    data.assets[0].name,
                  )
                : Linking.openURL(data.html_url),
          },
        ]);
        console.log('version', data.tag_name.replace('v', ''), pkg.version);
      } else {
        ToastAndroid.show('App is up to date', ToastAndroid.SHORT);
        console.log('version', data.tag_name.replace('v', ''), pkg.version);
      }
    } catch (error) {
      ToastAndroid.show('Failed to check for update', ToastAndroid.SHORT);
      console.log('Update error', error);
    }
    setUpdateLoading(false);
  };
  return (
    <View className="w-full h-full bg-black p-4">
      <Text className="text-2xl font-bold text-white mt-7">About</Text>

      {/* version */}
      <View className="flex-row items-center justify-between mt-5 bg-tertiary p-2 rounded-md">
        <Text className="text-white font-semibold my-2">Version</Text>
        <Text className="text-white font-semibold my-2">v{pkg.version}</Text>
      </View>

      {/* Auto Download Updates*/}
      {/* <View className="flex-row items-center justify-between mt-5 bg-tertiary p-2 rounded-md">
        <Text className="text-white font-semibold my-2">
          Auto Download Updates
        </Text>
        <Switch
          value={autoDownload}
          onValueChange={() => {
            setAutoDownload(!autoDownload);
            MMKV.setBool('autoDownload', !autoDownload);
          }}
          thumbColor={autoDownload ? 'tomato' : 'gray'}
        />
      </View> */}

      {/* Auto check for updates */}
      <View className="flex-row items-center justify-between mt-5 bg-tertiary p-2 rounded-md">
        <Text className="text-white font-semibold my-2">
          Check for Updates on Start
        </Text>
        <Switch
          value={autoCheckUpdate}
          onValueChange={() => {
            setAutoCheckUpdate(!autoCheckUpdate);
            MMKV.setBool('autoCheckUpdate', !autoCheckUpdate);
          }}
          thumbColor={autoCheckUpdate ? 'tomato' : 'gray'}
        />
      </View>

      <TouchableNativeFeedback
        onPress={checkForUpdate}
        disabled={updateLoading}
        background={TouchableNativeFeedback.Ripple('gray', false)}>
        <View className=" flex-row items-center px-4 justify-between mt-5 bg-tertiary p-2 rounded-md">
          <Text className="text-white font-semibold my-2">
            Check for Updates
          </Text>
          <Feather
            name="chevron-right"
            size={20}
            color="white"
            className="my-2"
          />
        </View>
      </TouchableNativeFeedback>
    </View>
  );
};

export default About;

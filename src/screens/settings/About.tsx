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
import RNApkInstaller from '@dominicvonk/react-native-apk-installer';
import {MaterialCommunityIcons} from '@expo/vector-icons';
import useThemeStore from '../../lib/zustand/themeStore';

// download update
const downloadUpdate = async (url: string, name: string, theme: string) => {
  console.log('downloading', url, name);
  await notifee.requestPermission();
  // Create a channel (required for Android)
  const channelId = await notifee.createChannel({
    id: 'download',
    name: 'Download Notifications',
  });
  try {
    if (await RNFS.exists(`${RNFS.DownloadDirectoryPath}/${name}`)) {
      notifee.displayNotification({
        title: 'Download Completed',
        body: 'Tap to install',
        data: {name: `${name}`},
        android: {
          color: theme,
          smallIcon: 'ic_notification',
          channelId,
          pressAction: {
            id: 'install',
          },
        },
      });
      return;
    }
  } catch (error) {}
  const {promise} = RNFS.downloadFile({
    fromUrl: url,
    background: true,
    progressInterval: 1000,
    progressDivider: 1,
    toFile: `${RNFS.DownloadDirectoryPath}/${name}`,
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
          smallIcon: 'ic_notification',
          channelId,
          color: theme,
          onlyAlertOnce: true,
          progress: {
            current: res.bytesWritten,
            max: res.contentLength,
          },
        },
      });
    },
  });
  promise.then(async res => {
    if (res.statusCode === 200) {
      notifee.cancelNotification('downloadUpdate');
      notifee.displayNotification({
        title: 'Download Complete',
        body: 'Tap to install',
        data: {name},
        android: {
          color: theme,
          smallIcon: 'ic_notification',
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
export const checkForUpdate = async (
  setUpdateLoading: React.Dispatch<React.SetStateAction<boolean>>,
  autoDownload: boolean,
  showToast: boolean = true,
  primary: string,
) => {
  setUpdateLoading(true);
  try {
    const res = await fetch(
      'https://api.github.com/repos/Zenda-Cross/vega-app/releases/latest',
    );
    const data = await res.json();
    const localVersion = Number(pkg.version?.split('.').join(''));
    const remoteVersion = Number(
      data.tag_name.replace('v', '')?.split('.').join(''),
    );
    if (compareVersions(pkg.version, data.tag_name.replace('v', ''))) {
      ToastAndroid.show('New update available', ToastAndroid.SHORT);
      Alert.alert(`Update v${pkg.version} -> ${data.tag_name}`, data.body, [
        {text: 'Cancel'},
        {
          text: 'Update',
          onPress: () =>
            autoDownload
              ? downloadUpdate(
                  data?.assets?.[2]?.browser_download_url,
                  data.assets?.[2]?.name,
                  primary,
                )
              : Linking.openURL(data.html_url),
        },
      ]);
      console.log(
        'local version',
        localVersion,
        'remote version',
        remoteVersion,
      );
    } else {
      showToast && ToastAndroid.show('App is up to date', ToastAndroid.SHORT);
      console.log(
        'local version',
        localVersion,
        'remote version',
        remoteVersion,
      );
    }
  } catch (error) {
    ToastAndroid.show('Failed to check for update', ToastAndroid.SHORT);
    console.log('Update error', error);
  }
  setUpdateLoading(false);
};

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
    console.log('install', res);
    if (res) {
      const installPermission =
        await RNApkInstaller.haveUnknownAppSourcesPermission();
      console.log('installPermission', installPermission);
      if (!installPermission) {
        RNApkInstaller.showUnknownAppSourcesPermission();
      }

      RNApkInstaller.install(
        `${RNFS.DownloadDirectoryPath}/${detail.notification?.data?.name}`,
      );
    }
  }
}
notifee.onForegroundEvent(handleAction);
notifee.onBackgroundEvent(handleAction);

const About = () => {
  const {primary} = useThemeStore(state => state);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [autoDownload, setAutoDownload] = useState(
    MMKV.getBool('autoDownload') || false,
  );
  const [autoCheckUpdate, setAutoCheckUpdate] = useState<boolean>(
    MMKV.getBool('autoCheckUpdate') || true,
  );

  return (
    <View className="flex-1 bg-black">
      <View className="px-4 py-3 border-b border-white/10">
        <Text className="text-2xl font-bold text-white">About</Text>
        <Text className="text-gray-400 mt-1 text-sm">
          App information and updates
        </Text>
      </View>

      <View className="p-4 space-y-3">
        {/* Version */}
        <View className="bg-white/10 p-4 rounded-lg flex-row justify-between items-center">
          <Text className="text-white text-base">Version</Text>
          <Text className="text-white/70">v{pkg.version}</Text>
        </View>

        {/* Auto Install Updates */}
        <View className="bg-white/10 p-4 rounded-lg flex-row justify-between items-center">
          <Text className="text-white text-base">Auto Install Updates</Text>
          <Switch
            value={autoDownload}
            onValueChange={() => {
              setAutoDownload(!autoDownload);
              MMKV.setBool('autoDownload', !autoDownload);
            }}
            thumbColor={autoDownload ? primary : 'gray'}
          />
        </View>

        {/* Auto Check Updates */}
        <View className="bg-white/10 p-4 rounded-lg flex-row justify-between items-center">
          <Text className="text-white text-base">Check Updates on Start</Text>
          <Switch
            value={autoCheckUpdate}
            onValueChange={() => {
              setAutoCheckUpdate(!autoCheckUpdate);
              MMKV.setBool('autoCheckUpdate', !autoCheckUpdate);
            }}
            thumbColor={autoCheckUpdate ? primary : 'gray'}
          />
        </View>

        {/* Check Updates Button */}
        <TouchableNativeFeedback
          onPress={() => checkForUpdate(setUpdateLoading, autoDownload, true, primary)}
          disabled={updateLoading}
          background={TouchableNativeFeedback.Ripple('#ffffff20', false)}>
          <View className="bg-white/10 p-4 rounded-lg flex-row justify-between items-center">
            <View className="flex-row items-center space-x-3">
              <MaterialCommunityIcons
                name="update"
                size={22}
                color="white"
              />
              <Text className="text-white text-base">Check for Updates</Text>
            </View>
            <Feather name="chevron-right" size={20} color="white" />
          </View>
        </TouchableNativeFeedback>
      </View>
    </View>
  );
};

export default About;

function compareVersions(localVersion: string, remoteVersion: string): boolean {
  try {
    // Split versions into arrays and convert to numbers
    const local = localVersion.split('.').map(Number);
    const remote = remoteVersion.split('.').map(Number);

    // Compare major version
    if (remote[0] > local[0]) {
      return true;
    }
    if (remote[0] < local[0]) {
      return false;
    }

    // Compare minor version
    if (remote[1] > local[1]) {
      return true;
    }
    if (remote[1] < local[1]) {
      return false;
    }

    // Compare patch version
    if (remote[2] > local[2]) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Invalid version format');
    return false;
  }
}

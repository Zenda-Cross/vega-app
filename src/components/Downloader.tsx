import React, {useEffect, useLayoutEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  ToastAndroid,
  Clipboard,
} from 'react-native';
import RNFS from 'react-native-fs';
import {ifExists} from '../lib/file/ifExists';
// import {
//   download,
//   completeHandler,
//   checkForExistingDownloads,
// } from '@kesha-antonov/react-native-background-downloader';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Octicons from '@expo/vector-icons/Octicons';
import {Stream} from '../lib/providers/types';
import {MotiView} from 'moti';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {Skeleton} from 'moti/skeleton';
import useContentStore from '../lib/zustand/contentStore';
import {manifest} from '../lib/Manifest';
import * as IntentLauncher from 'expo-intent-launcher';
import notifee from '@notifee/react-native';
import {EventType, EventDetail} from '@notifee/react-native';
import useDownloadsStore from '../lib/zustand/downloadsStore';
import {hlsDownloader} from '../lib/hlsDownloader';
const DownloadComponent = ({
  link,
  fileName,
  type,
  providerValue,
  title,
}: {
  link: string;
  fileName: string;
  type: string;
  providerValue: string;
  title: string;
}) => {
  const {provider} = useContentStore(state => state);
  const [alreadyDownloaded, setAlreadyDownloaded] = useState<string | boolean>(
    false,
  );
  const [deleteModal, setDeleteModal] = useState(false);
  const [downloadModal, setDownloadModal] = useState(false);
  const [longPressModal, setLongPressModal] = useState(false);
  const [servers, setServers] = useState<Stream[]>([]);
  const [serverLoading, setServerLoading] = useState(false);

  const reqController = new AbortController();

  const {activeDownloads, removeActiveDownloads, setActiveDownloads} =
    useDownloadsStore(state => state);

  async function actionHandler({
    type,
    detail,
  }: {
    type: EventType;
    detail: EventDetail;
  }) {
    if (
      type === EventType.ACTION_PRESS &&
      detail.pressAction?.id === fileName
    ) {
      console.log('Cancel download');
      RNFS.stopDownload(Number(detail.notification?.data?.jobId));
      setAlreadyDownloaded(false);
      removeActiveDownloads(fileName);
      try {
        const downloadDir = `${RNFS.DownloadDirectoryPath}/vega`;
        const files = await RNFS.readDir(downloadDir);
        // Find a file with the given name (without extension)
        const file = files.find(file => {
          const nameWithoutExtension = file.name
            .split('.')
            .slice(0, -1)
            .join('.');
          return nameWithoutExtension === detail.notification?.data?.fileName;
        });
        if (file) {
          await RNFS.unlink(file.path);
        }
      } catch (error) {
        console.log(error);
      }
    }
  }
  notifee.onBackgroundEvent(actionHandler);
  notifee.onForegroundEvent(actionHandler);

  // check if file already exists
  useLayoutEffect(() => {
    const checkIfDownloaded = async () => {
      const exists = await ifExists(fileName);
      setAlreadyDownloaded(exists);
    };
    checkIfDownloaded();
  }, [fileName]);

  const downloadFile = async (url: string, fileType: string) => {
    setActiveDownloads(fileName);
    if (await ifExists(fileName)) {
      console.log('File already exists');
      setAlreadyDownloaded(true);
      removeActiveDownloads(fileName);
      return;
    }
    try {
      // downloadFile and save it to download folder
      if (!(await RNFS.exists(`${RNFS.DownloadDirectoryPath}/vega`))) {
        await RNFS.mkdir(`${RNFS.DownloadDirectoryPath}/vega`);
      }
      if (fileType === 'm3u8') {
        hlsDownloader(
          url,
          `${RNFS.DownloadDirectoryPath}/vega/${fileName}.mp4`,
        );
        return;
      }

      await notifee.requestPermission();
      // Create a channel (required for Android)
      const channelId = await notifee.createChannel({
        id: 'download',
        name: 'Download Notifications',
      });
      const downloadDest = `${RNFS.DownloadDirectoryPath}/vega/${fileName}.${fileType}`;
      const ret = RNFS.downloadFile({
        fromUrl: url,
        progressInterval: 1000,
        backgroundTimeout: 1000 * 60 * 60,
        progressDivider: 1,
        toFile: downloadDest,
        background: true,
        begin: (res: any) => {
          console.log('Download has started', res);
        },
        progress: (res: any) => {
          const progress = res.bytesWritten / res.contentLength;
          const body =
            res.contentLength < 1024 * 1024 * 1024
              ? // less than 1GB?

                Math.round(res.bytesWritten / 1024 / 1024) +
                ' / ' +
                Math.round(res.contentLength / 1024 / 1024) +
                ' MB'
              : parseFloat((res.bytesWritten / 1024 / 1024 / 1024).toFixed(2)) +
                ' / ' +
                parseFloat(
                  (res.contentLength / 1024 / 1024 / 1024).toFixed(2),
                ) +
                ' GB';
          console.log('Download progress:', progress * 100);
          notifee.displayNotification({
            id: fileName,
            title: title,
            data: {jobId: ret.jobId, fileName},
            body: body,
            android: {
              channelId,
              color: '#FF6347',
              onlyAlertOnce: true,
              progress: {
                max: 100,
                current: progress * 100,
                indeterminate: false,
              },
              pressAction: {
                id: 'default',
              },
              actions: [
                {
                  title: 'Cancel',
                  pressAction: {
                    id: fileName,
                  },
                },
              ],
            },
          });
        },
      });
      ret.promise.then(res => {
        console.log('Download complete', res);
        setAlreadyDownloaded(true);
        notifee.cancelNotification(fileName);
        notifee.displayNotification({
          id: 'downloadComplete' + fileName,
          title: title,
          body: 'Download complete',
          android: {
            channelId,
            color: '#FF6347',
          },
        });
        removeActiveDownloads(fileName);
      });
      ret.promise.catch(err => {
        console.log('Download error:', err);
        Alert.alert('Download failed', err.message || 'Failed to download');
        notifee.cancelNotification(fileName);
        notifee.displayNotification({
          id: 'downloadFailed' + fileName,
          title: title,
          body: 'Download failed',
          android: {
            channelId,
            color: '#FF6347',
          },
        });
        removeActiveDownloads(fileName);
        setAlreadyDownloaded(false);
        notifee.cancelNotification(fileName);
      });
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert('Download failed', 'Failed to download');
      removeActiveDownloads(fileName);
      setAlreadyDownloaded(false);
    }
  };

  // handle download deletion
  const deleteDownload = async () => {
    const downloadDir = `${RNFS.DownloadDirectoryPath}/vega`;
    try {
      const files = await RNFS.readDir(downloadDir);
      // Find a file with the given name (without extension)
      const file = files.find(file => {
        const nameWithoutExtension = file.name
          .split('.')
          .slice(0, -1)
          .join('.');
        return nameWithoutExtension === fileName;
      });
      if (file) {
        await RNFS.unlink(file.path);
        setAlreadyDownloaded(false);
        setDeleteModal(false);
      }
    } catch (error) {
      console.error(error);
    }
  };

  // choose server
  useEffect(() => {
    if (!downloadModal && !longPressModal) {
      return;
    }
    const getServer = async () => {
      setServerLoading(true);
      const servers = await manifest[providerValue || provider.value].getStream(
        link,
        type,
        reqController.signal,
      );
      const filteredServers = servers.filter(
        server =>
          !manifest[
            providerValue || provider.value
          ].nonDownloadableServer?.includes(server.server),
      );
      setServerLoading(false);
      setServers(filteredServers);
    };
    getServer();
  }, [downloadModal, longPressModal]);

  // on holdPress external downloader
  const longPressDownload = async (link: string) => {
    try {
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: link,
        type: 'application/octet-stream',
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View className="flex-row items-center mt-1 justify-between rounded-full bg-white/30 p-1">
      {activeDownloads.includes(fileName) ? (
        <MotiView
          style={{
            marginHorizontal: 4,
          }}
          onPress={() => console.log('Cancel download')}
          // animate opacity to opacity while downloding
          from={{opacity: 1}}
          animate={{opacity: 0.5}}
          //@ts-ignore
          transition={{type: 'timing', duration: 500, loop: true}}>
          <MaterialIcons name="downloading" size={27} color="tomato" />
        </MotiView>
      ) : alreadyDownloaded ? (
        <TouchableOpacity onPress={() => setDeleteModal(true)} className="mx-1">
          <MaterialIcons name="delete-outline" size={27} color="#c1c4c9" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => {
            setDownloadModal(true);
          }}
          onLongPress={() => {
            ReactNativeHapticFeedback.trigger('effectHeavyClick', {
              enableVibrateFallback: true,
              ignoreAndroidSystemSettings: false,
            });
            setLongPressModal(true);
          }}
          className="mx-2">
          <Octicons name="download" size={25} color="#c1c4c9" />
        </TouchableOpacity>
      )}
      {/* delete modal */}
      {
        <Modal animationType="fade" visible={deleteModal} transparent={true}>
          <View className="flex-1 bg-black/10 justify-center items-center p-4">
            <View className="bg-tertiary p-3 w-80 rounded-md justify-center items-center">
              <Text className="text-2xl font-semibold my-3 text-white">
                Confirm to delete
              </Text>
              <View className="flex-row items-center justify-evenly w-full my-5">
                <TouchableOpacity
                  onPress={deleteDownload}
                  className="bg-primary p-2 rounded-md m-1 px-3">
                  <Text className="text-white font-semibold text-base rounded-md capitalize px-1">
                    Yes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setDeleteModal(false)}
                  className="bg-primary p-2 px-4 rounded-md m-1">
                  <Text className="text-white font-semibold text-base rounded-md capitalize px-1">
                    No
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      }
      {/* download modal */}
      {
        <Modal animationType="fade" visible={downloadModal} transparent={true}>
          <View className="flex-1 bg-black/10 justify-center items-center p-4">
            <View className="bg-tertiary p-3 w-full rounded-md justify-center items-center">
              <Text className="text-lg font-semibold my-3 text-white">
                Select a server to download
              </Text>
              <View className="flex-row items-center flex-wrap gap-1 justify-evenly w-full my-5">
                {!serverLoading
                  ? servers?.map((server, index) => (
                      <TouchableOpacity
                        key={server.server + index}
                        onPress={() => {
                          setDownloadModal(false);
                          downloadFile(server.link, server.type);
                        }}
                        onLongPress={() => {
                          ReactNativeHapticFeedback.trigger(
                            'effectHeavyClick',
                            {
                              enableVibrateFallback: true,
                              ignoreAndroidSystemSettings: false,
                            },
                          );
                          Clipboard.setString(server.link);
                          ToastAndroid.show(
                            'Link copied to clipboard',
                            ToastAndroid.SHORT,
                          );
                        }}
                        className="bg-primary p-2 rounded-md m-1">
                        <Text className="text-white text-xs rounded-md capitalize px-1">
                          {server.server}
                        </Text>
                      </TouchableOpacity>
                    ))
                  : Array.from({length: 3}).map((_, index) => (
                      <Skeleton
                        key={index}
                        show={true}
                        colorMode="dark"
                        height={30}
                        width={90}
                      />
                    ))}
                {serverLoading === false && servers.length === 0 && (
                  <Text className="text-red-500 text-center">
                    No server available to download
                  </Text>
                )}
              </View>
              <View className="flex-row items-center gap-2 w-full">
                <MaterialIcons
                  name="info-outline"
                  size={14}
                  color="#c1c4c9"
                  onPress={() => setDownloadModal(false)}
                />
                <Text className="text-[10px] text-center text-white">
                  Long press to copy download link
                </Text>
              </View>
              {/* close modal */}
              <TouchableOpacity
                onPress={() => {
                  setDownloadModal(false);
                  reqController.abort();
                }}
                className="absolute top-2 right-2">
                <MaterialIcons name="close" size={20} color="#c1c4c9" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      }
      {/* long press modal */}
      {
        <Modal animationType="fade" visible={longPressModal} transparent={true}>
          <View className="flex-1 bg-black/10 justify-center items-center p-4">
            <View className="bg-tertiary p-3 w-full rounded-md justify-center items-center">
              <Text className="text-lg font-semibold my-3 text-white">
                Select a server to open
              </Text>
              <View className="flex-row items-center flex-wrap gap-1 justify-evenly w-full my-5">
                {!serverLoading
                  ? servers?.map((server, index) => (
                      <TouchableOpacity
                        key={server.server + index}
                        onPress={() => {
                          setLongPressModal(false);
                          longPressDownload(server.link);
                        }}
                        className="bg-primary p-2 rounded-md m-1">
                        <Text className="text-white text-xs rounded-md capitalize px-1">
                          {server.server}
                        </Text>
                      </TouchableOpacity>
                    ))
                  : Array.from({length: 3}).map((_, index) => (
                      <Skeleton
                        key={index}
                        show={true}
                        colorMode="dark"
                        height={30}
                        width={90}
                      />
                    ))}
              </View>
              {/* close modal */}
              <TouchableOpacity
                onPress={() => setLongPressModal(false)}
                className="absolute top-2 right-2">
                <MaterialIcons name="close" size={20} color="#c1c4c9" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      }
    </View>
  );
};

export default DownloadComponent;

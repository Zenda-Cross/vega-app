import React, {useEffect, useLayoutEffect, useState} from 'react';
import {
  View,
  Button,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  ToastAndroid,
  Clipboard,
} from 'react-native';
import RNFS from 'react-native-fs';
import {ifExists} from '../lib/file/ifExists';
import {
  download,
  completeHandler,
  checkForExistingDownloads,
} from '@kesha-antonov/react-native-background-downloader';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Octicons from '@expo/vector-icons/Octicons';
import {getStream, Stream} from '../lib/getStream';
import {MotiView} from 'moti';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {Skeleton} from 'moti/skeleton';

const DownloadComponent = ({
  link,
  fileName,
  type,
}: {
  link: string;
  fileName: string;
  type: string;
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [alreadyDownloaded, setAlreadyDownloaded] = useState<string | boolean>(
    false,
  );
  const [deleteModal, setDeleteModal] = useState(false);
  const [downloadModal, setDownloadModal] = useState(false);
  const [servers, setServers] = useState<Stream[]>([]);
  const [serverLoading, setServerLoading] = useState(false);

  useLayoutEffect(() => {
    const checkIfDownloaded = async () => {
      const exists = await ifExists(fileName);
      setAlreadyDownloaded(exists);

      // check if download is already in progress
      const tasks = await checkForExistingDownloads();
      // console.log('Tasks:', tasks);
      const task = tasks.find(item => item.id === fileName);
      if (task?.state === 'DOWNLOADING') {
        setIsDownloading(true);
        const timer = setInterval(async () => {
          const fileExists = await ifExists(fileName);
          if (fileExists) {
            console.log('Download complete');
            clearInterval(timer);
            setIsDownloading(false);
            setAlreadyDownloaded(true);
            clearInterval(timer);
          }
        }, 1000);
      } else {
        task?.stop();
        setIsDownloading(false);
      }
    };
    checkIfDownloaded();
  }, [fileName]);

  const downloadFile = async (url: string) => {
    setIsDownloading(true);

    if (await ifExists(fileName)) {
      console.log('File already exists');
      setIsDownloading(false);
      return;
    }
    // try {
    //   // downloadFile and save it to download folder
    //   if (!(await RNFS.exists(`${RNFS.DownloadDirectoryPath}/vega`))) {
    //     await RNFS.mkdir(`${RNFS.DownloadDirectoryPath}/vega`);
    //   }
    //   const downloadDest = `${RNFS.DownloadDirectoryPath}/vega/${fileName}`;
    //   const ret = RNFS.downloadFile({
    //     fromUrl: url,
    //     progressInterval: 1000,
    //     backgroundTimeout: 1000 * 60 * 60,
    //     progressDivider: 1,
    //     toFile: downloadDest,
    //     background: true,
    //     begin: (res: any) => {
    //       console.log('Download has started', res);
    //     },
    //     progress: (res: any) => {
    //       const progress = res.bytesWritten / res.contentLength;
    //       setDownloadProgress(progress * 100);
    //       console.log('Download progress:', progress * 100);
    //     },
    //   });
    //   ret.promise.then(res => {
    //     console.log('Download complete', res);
    //     setIsDownloading(false);
    //   });
    // } catch (error: any) {
    //   console.error('Download error:', error);
    //   setDownloadError(error.message);
    //   setIsDownloading(false);
    // }

    const jobId = fileName;
    console.log('Downloading:', fileName);

    let task = download({
      isAllowedOverMetered: true,
      isAllowedOverRoaming: true,
      // headers: {
      //   Accept:
      //     'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      //   'User-Agent':
      //     '	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0',
      // },
      id: jobId,
      url: url,
      destination: `${RNFS.DownloadDirectoryPath}/vega/${fileName}`,
      metadata: {},
      isNotificationVisible: true,
    })
      .begin(data => {
        console.log(`Going to download ${data.expectedBytes} bytes!`);
        console.log('Downloading:', data);
      })
      .progress(({bytesDownloaded, bytesTotal}) => {
        console.log(`Downloaded: ${(bytesDownloaded / bytesTotal) * 100}%`);
      })
      .done(({bytesDownloaded, bytesTotal}) => {
        console.log('Download is done!', {bytesDownloaded, bytesTotal});
        setIsDownloading(false);
        setAlreadyDownloaded(true);
        completeHandler(jobId);
      })
      .error(({error, errorCode}) => {
        console.log('Download canceled due to error: ', {error, errorCode});
        setIsDownloading(false);
        task.stop();
        Alert.alert('Download Canceled', 'failed to download');
      });

    return () => {
      task.stop();
    };
  };

  // handle download deletion
  const deleteDownload = async () => {
    try {
      await RNFS.unlink(`${RNFS.DownloadDirectoryPath}/vega/${fileName}`);
      setAlreadyDownloaded(false);
      setDeleteModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  // choose server
  useEffect(() => {
    if (!downloadModal) {
      return;
    }
    const getServer = async () => {
      setServerLoading(true);
      const url = await getStream(link, type);
      setServerLoading(false);
      setServers(url);
    };
    getServer();
  }, [downloadModal]);

  return (
    <View className="flex-row items-center mt-1 justify-between rounded-full bg-white/30 p-1">
      {alreadyDownloaded ? (
        <TouchableOpacity onPress={() => setDeleteModal(true)} className="mx-1">
          <MaterialIcons name="file-download-done" size={27} color="#c1c4c9" />
        </TouchableOpacity>
      ) : isDownloading ? (
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
      ) : (
        <TouchableOpacity
          onPress={() => {
            setDownloadModal(true);
          }}
          className="mx-2">
          <Octicons name="download" size={25} color="#c1c4c9" />
        </TouchableOpacity>
      )}
      {deleteModal && (
        <Modal animationType="fade" visible={deleteModal} transparent={true}>
          <View className="flex-1 bg-black/10 justify-center items-center p-4">
            <View className="bg-tertiary p-3 w-80 rounded-md justify-center items-center">
              <Text className="text-lg font-semibold my-3 text-white">
                Are you sure you want to delete this file?
              </Text>
              <Text className="text-xs text-center text-white">{fileName}</Text>
              <View className="flex-row items-center justify-evenly w-full my-5">
                <Button
                  color={'tomato'}
                  title="Yes"
                  onPress={() => deleteDownload()}
                />
                <Button
                  color={'tomato'}
                  title="No"
                  onPress={() => setDeleteModal(false)}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
      {/* download modal */}
      {downloadModal && (
        <Modal animationType="fade" visible={downloadModal} transparent={true}>
          <View className="flex-1 bg-black/10 justify-center items-center p-4">
            <View className="bg-tertiary p-3 w-full rounded-md justify-center items-center">
              <Text className="text-lg font-semibold my-3 text-white">
                Select a server to download
              </Text>
              <View className="flex-row items-center flex-wrap gap-1 justify-evenly w-full my-5">
                {!serverLoading
                  ? servers.map((server, index) => (
                      <TouchableOpacity
                        key={server.server + index}
                        onPress={() => {
                          setDownloadModal(false);
                          downloadFile(server.link);
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
                onPress={() => setDownloadModal(false)}
                className="absolute top-2 right-2">
                <MaterialIcons name="close" size={20} color="#c1c4c9" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default DownloadComponent;

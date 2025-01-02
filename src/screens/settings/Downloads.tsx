import {
  View,
  Text,
  Image,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import requestStoragePermission from '../../lib/file/getStoragePermission';
import * as FileSystem from 'expo-file-system';
import {downloadFolder} from '../../lib/constants';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, {useState, useEffect} from 'react';
import Entypo from '@expo/vector-icons/Entypo';
import {MmmkvCache} from '../../lib/Mmkv';
import useThemeStore from '../../lib/zustand/themeStore';
import RNFS from 'react-native-fs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import RNReactNativeHapticFeedback from 'react-native-haptic-feedback';

// Define supported video extensions
const VIDEO_EXTENSIONS = [
  '.mp4',
  '.mov',
  '.avi',
  '.mkv',
  '.wmv',
  '.flv',
  '.webm',
  '.m4v',
];

const isVideoFile = (filename: string): boolean => {
  const extension = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return VIDEO_EXTENSIONS.includes(extension);
};
const Downloads = () => {
  const [files, setFiles] = useState<FileSystem.FileInfo[]>([]);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const {primary} = useThemeStore(state => state);

  const [groupSelected, setGroupSelected] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Load files from the download folder on initial render
  useEffect(() => {
    const getFiles = async () => {
      setLoading(true);
      const granted = await requestStoragePermission();
      if (granted) {
        try {
          const properPath =
            Platform.OS === 'android'
              ? `file://${downloadFolder}`
              : downloadFolder;

          const allFiles = await FileSystem.readDirectoryAsync(properPath);

          // Filter video files
          const videoFiles = allFiles.filter(file => isVideoFile(file));

          const filesInfo = await Promise.all(
            videoFiles.map(async file => {
              const filePath =
                Platform.OS === 'android'
                  ? `file://${downloadFolder}/${file}`
                  : `${downloadFolder}/${file}`;

              const fileInfo = await FileSystem.getInfoAsync(filePath);
              return fileInfo;
            }),
          );
          MmmkvCache.setString('downloadFiles', JSON.stringify(filesInfo));
          setFiles(filesInfo);
          setLoading(false);
        } catch (error) {
          console.error('Error reading files:', error);
          setLoading(false);
        }
      }
    };
    getFiles();
  }, []);

  async function getThumbnail(file: FileSystem.FileInfo) {
    try {
      // Verify it's a video file before attempting to generate thumbnail
      const fileName = file.uri.split('/').pop();
      if (!fileName || !isVideoFile(fileName)) {
        return null;
      }

      const {uri} = await VideoThumbnails.getThumbnailAsync(file.uri, {
        time: 100000,
      });
      return uri;
    } catch (error) {
      console.log('error in getThumbnail:', error);
      return null;
    }
  }

  // Generate thumbnails for each file
  useEffect(() => {
    const getThumbnails = async () => {
      try {
        const thumbnailPromises = files.map(async file => {
          const thumbnail = await getThumbnail(file);
          if (thumbnail) {
            return {[file.uri]: thumbnail};
          }
          return null;
        });

        const thumbnailResults = await Promise.all(thumbnailPromises);
        const newThumbnails = thumbnailResults.reduce((acc, curr) => {
          return curr ? {...acc, ...curr} : acc;
        }, {});
        MmmkvCache.setString(
          'downloadThumbnails',
          JSON.stringify(newThumbnails),
        );
        setThumbnails(newThumbnails);
      } catch (error) {
        console.error('Error generating thumbnails:', error);
      }
    };

    if (files.length > 0) {
      getThumbnails();
    }
  }, [files]);

  // Load files and thumbnails from cache on initial render
  useEffect(() => {
    const downloadFiles = MmmkvCache.getString('downloadFiles');
    if (downloadFiles) {
      setFiles(JSON.parse(downloadFiles));
    }
    const downloadThumbnails = MmmkvCache.getString('downloadThumbnails');
    if (downloadThumbnails) {
      setThumbnails(JSON.parse(downloadThumbnails));
    }
  }, []);

  const deleteFiles = async () => {
    try {
      // Process each file
      await Promise.all(
        groupSelected.map(async fileUri => {
          try {
            // Remove the 'file://' prefix for Android
            const path =
              Platform.OS === 'android'
                ? fileUri.replace('file://', '')
                : fileUri;

            const fileInfo = await FileSystem.getInfoAsync(fileUri);
            if (fileInfo.exists) {
              await RNFS.unlink(path);
            }
          } catch (error) {
            console.error(`Error deleting file ${fileUri}:`, error);
            throw error; // Re-throw to be caught by the outer try-catch
          }
        }),
      );

      // Update state after successful deletion
      const newFiles = files.filter(file => !groupSelected.includes(file.uri));
      setFiles(newFiles);
      setGroupSelected([]);
      setIsSelecting(false);

      // Optional: Show success message
    } catch (error) {
      console.error('Error deleting files:', error);
    }
  };

  return (
    <View className="mt-14 px-2 w-full h-full">
      <View className="flex-row justify-between items-center">
        <Text className="text-2xl">Downloads</Text>
        <View className="flex-row gap-x-7 items-center">
          {isSelecting && (
            <MaterialCommunityIcons
              name="close"
              size={28}
              color={primary}
              onPress={() => {
                setGroupSelected([]);
                setIsSelecting(false);
              }}
            />
          )}
          {isSelecting && groupSelected.length > 0 && (
            <MaterialCommunityIcons
              name="delete-outline"
              size={28}
              color={primary}
              onPress={deleteFiles}
            />
          )}
        </View>
      </View>
      <ScrollView className="mt-5 h-[80%]">
        <View className="flex flex-wrap mt-7">
          {files.map(file => {
            const fileName = file.uri
              .split('/')
              .pop()
              ?.replaceAll('_', ' ')
              .replace('.mp4', '')
              .replace('.mkv', '');
            return (
              <TouchableOpacity
                className={`flex-row w-full h-[90px] mb-1 items-center rounded-md px-1 ${
                  groupSelected.includes(file.uri) && 'bg-quaternary'
                }`}
                key={file.uri}
                onLongPress={() => {
                  RNReactNativeHapticFeedback.trigger('effectTick', {
                    enableVibrateFallback: true,
                    ignoreAndroidSystemSettings: false,
                  });
                  setGroupSelected([...groupSelected, file.uri]);
                  setIsSelecting(true);
                }}
                onPress={() => {
                  if (isSelecting) {
                    RNReactNativeHapticFeedback.trigger('effectTick', {
                      enableVibrateFallback: true,
                      ignoreAndroidSystemSettings: false,
                    });

                    if (groupSelected.includes(file.uri)) {
                      setGroupSelected(
                        groupSelected.filter(f => f !== file.uri),
                      );
                    } else {
                      setGroupSelected([...groupSelected, file.uri]);
                    }
                    if (
                      groupSelected.length === 1 &&
                      groupSelected[0] === file.uri
                    ) {
                      setIsSelecting(false);
                      setGroupSelected([]);
                    }
                  } else {
                    try {
                      navigation.navigate('Player', {
                        episodeList: [{title: fileName || '', link: file.uri}],
                        linkIndex: 0,
                        type: '',
                        directUrl: file.uri,
                        primaryTitle: fileName,
                        poster: {},
                        providerValue: 'vega',
                      });
                    } catch (error) {
                      console.error('Error navigating to Player:', error);
                    }
                  }
                }}>
                <View
                  className={`relative border mr-3 ${
                    groupSelected.includes(file.uri) && 'bg-quaternary'
                  }`}>
                  {thumbnails[file.uri] ? (
                    <Image
                      className="rounded-md"
                      source={{uri: thumbnails[file.uri]}}
                      style={{width: 105, height: 70}}
                    />
                  ) : (
                    <View className="w-[105px] h-[70px] rounded-md bg-quaternary" />
                  )}
                  <Entypo
                    name="controller-play"
                    size={24}
                    color={'white'}
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: [{translateX: -12}, {translateY: -20}],
                    }}
                  />
                </View>
                <View className="h-[70px] flex-row items-start overflow-hidden">
                  <Text className="w-[83%] text-[13.5px] whitespace-pre-wrap">
                    {fileName}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        {
          // Show a message if no files are available
          files.length === 0 && !loading && (
            <Text className="text-center mt-10 text-lg">Looks Empty Here!</Text>
          )
        }
        <View className="h-28" />
      </ScrollView>
    </View>
  );
};

export default Downloads;

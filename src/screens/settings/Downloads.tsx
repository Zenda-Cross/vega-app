import {
  View,
  Text,
  Image,
  Platform,
  TouchableOpacity,
  Pressable,
  PermissionsAndroid,
  Alert,
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

  const {primary} = useThemeStore(state => state);

  const [groupSelected, setGroupSelected] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);

  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const getFiles = async () => {
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
        } catch (error) {
          console.error('Error reading files:', error);
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
        time: 15000,
      });
      return uri;
    } catch (error) {
      console.log('error in getThumbnail:', error);
      return null;
    }
  }

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
    <Pressable
      className="mt-14 px-3 min-h-full"
      onPress={() => setGroupSelected([])}>
      <View className="flex-row justify-between items-center">
        <Text className="text-2xl">Downloads</Text>
        <View className="flex-row gap-x-3 items-center">
          {/* {isSelecting && (
            <Text
              style={{color: primary}}
              onPress={() => {
                setGroupSelected([]);
                setIsSelecting(false);
              }}>
              Cancel
            </Text>
          )} */}
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
      <View className="flex flex-wrap mt-7">
        {files.map((file, index) => {
          const fileName = file.uri
            .split('/')
            .pop()
            ?.replaceAll('_', ' ')
            .replace('.mp4', '')
            .replace('.mkv', '');
          return (
            <TouchableOpacity
              className={`flex-row gap-x-3 h-[100px] justify-center items-center ${
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
                    setGroupSelected(groupSelected.filter(f => f !== file.uri));
                  } else {
                    setGroupSelected([...groupSelected, file.uri]);
                  }
                  if (groupSelected.length === 0) {
                    setIsSelecting(false);
                  }
                } else {
                  try {
                    navigation.navigate('Player', {
                      episodeList: [{title: fileName || '', link: file.uri}],
                      linkIndex: 0,
                      type: 'mp4',
                      directUrl: file.uri,
                      primaryTitle: fileName,
                      poster: {poster: ''},
                      providerValue: '',
                    });
                  } catch (error) {
                    console.error('Error navigating to Player:', error);
                  }
                }
              }}>
              <View
                className={`relative ${
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
              <Text className="w-[69%] whitespace-pre-wrap">{fileName}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Pressable>
  );
};

export default Downloads;

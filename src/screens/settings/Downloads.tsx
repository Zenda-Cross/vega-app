import {View, Text, Image, Platform, TouchableOpacity} from 'react-native';
import requestStoragePermission from '../../lib/file/getStoragePermission';
import * as FileSystem from 'expo-file-system';
import {downloadFolder} from '../../lib/constants';
import * as VideoThumbnails from 'expo-video-thumbnails';
import React, {useState, useEffect} from 'react';
import {MMKV, MmmkvCache} from '../../lib/Mmkv';
import useThemeStore from '../../lib/zustand/themeStore';
import RNFS from 'react-native-fs';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import RNReactNativeHapticFeedback from 'react-native-haptic-feedback';
import {FlashList} from '@shopify/flash-list';

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
      <View className="flex-row justify-between items-center mb-4">
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

      <FlashList
        data={files}
        numColumns={3}
        estimatedItemSize={150}
        ListEmptyComponent={() => (
          !loading && (
            <View className="flex-1 justify-center items-center mt-10">
              <Text className="text-center text-lg">Looks Empty Here!</Text>
            </View>
          )
        )}
        renderItem={({item}) => {
          const fileName = item.uri
            .split('/')
            .pop()
            ?.replaceAll('_', ' ')
            .replace('.mp4', '')
            .replace('.mkv', '');

          return (
            <TouchableOpacity
              className={`flex-1 m-0.5 rounded-lg overflow-hidden ${
                groupSelected.includes(item.uri) ? 'bg-quaternary' : 'bg-tertiary'
              }`}
              onLongPress={() => {
                if (MMKV.getBool('hapticFeedback') !== false) {
                  RNReactNativeHapticFeedback.trigger('effectTick', {
                    enableVibrateFallback: true,
                    ignoreAndroidSystemSettings: false,
                  });
                }
                setGroupSelected([...groupSelected, item.uri]);
                setIsSelecting(true);
              }}
              onPress={() => {
                if (isSelecting) {
                  if (MMKV.getBool('hapticFeedback') !== false) {
                    RNReactNativeHapticFeedback.trigger('effectTick', {
                      enableVibrateFallback: true,
                      ignoreAndroidSystemSettings: false,
                    });
                  }
                  if (groupSelected.includes(item.uri)) {
                    setGroupSelected(groupSelected.filter(f => f !== item.uri));
                  } else {
                    setGroupSelected([...groupSelected, item.uri]);
                  }
                  if (groupSelected.length === 1 && groupSelected[0] === item.uri) {
                    setIsSelecting(false);
                    setGroupSelected([]);
                  }
                } else {
                  navigation.navigate('Player', {
                    episodeList: [{title: fileName || '', link: item.uri}],
                    linkIndex: 0,
                    type: '',
                    directUrl: item.uri,
                    primaryTitle: fileName,
                    poster: {},
                    providerValue: 'vega',
                  });
                }
              }}>
              <View className="relative aspect-[2/3]">
                {thumbnails[item.uri] ? (
                  <Image
                    source={{uri: thumbnails[item.uri]}}
                    className="w-full h-full rounded-t-lg"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full bg-quaternary rounded-t-lg" />
                )}
                <View className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
                  <Text className="text-white text-xs" numberOfLines={1}>
                    {fileName}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

export default Downloads;

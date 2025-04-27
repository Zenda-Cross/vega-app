import {
  ScrollView,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  StatusBar,
  Platform,
} from 'react-native';
import {Easing} from 'react-native-reanimated';
import React, {useEffect, useState, useRef, useCallback} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {mainStorage, cacheStorage, settingsStorage} from '../../lib/storage';
import {OrientationLocker, LANDSCAPE} from 'react-native-orientation-locker';
import VideoPlayer from '@8man/react-native-media-console';
import {useNavigation} from '@react-navigation/native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  VideoRef,
  AudioTrack,
  TextTrack,
  SelectedVideoTrack,
  SelectedVideoTrackType,
  ResizeMode,
  VideoTrack,
  TextTracks,
  SelectedTrack,
  SelectedTrackType,
} from 'react-native-video';
import {MotiView} from 'moti';
import {manifest} from '../../lib/Manifest';
import useContentStore from '../../lib/zustand/contentStore';
import {CastButton, useRemoteMediaClient} from 'react-native-google-cast';
import {SafeAreaView} from 'react-native-safe-area-context';
import GoogleCast from 'react-native-google-cast';
import {Stream} from '../../lib/providers/types';
import DocumentPicker, {isCancel} from 'react-native-document-picker';
import useThemeStore from '../../lib/zustand/themeStore';
import {FlashList} from '@shopify/flash-list';
import SearchSubtitles from '../../components/SearchSubtitles';
import FullScreenChz from 'react-native-fullscreen-chz';
import {ifExists} from '../../lib/file/ifExists';
import useWatchHistoryStore from '../../lib/zustand/watchHistrory';

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;

type SettingsTabs = 'audio' | 'subtitle' | 'server' | 'quality' | 'speed';

const Player = ({route}: Props): React.JSX.Element => {
  const {primary} = useThemeStore(state => state);
  const {provider} = useContentStore();
  const {addItem, updatePlaybackInfo, updateItemWithInfo} =
    useWatchHistoryStore(); // Add updatePlaybackInfo and updateItemWithInfo here
  const [activeEpisode, setActiveEpisode] = useState(
    route.params?.episodeList?.[route.params.linkIndex],
  );
  const videoPositionRef = useRef({position: 0, duration: 0});
  const lastSavedPositionRef = useRef(0);
  const playerRef: React.RefObject<VideoRef> = useRef(null);
  const [stream, setStream] = useState<Stream[]>([]);
  const [selectedStream, setSelectedStream] = useState<Stream>(stream[0]);

  // controls
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTabs>('audio');
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] = useState<SelectedTrack>({
    type: SelectedTrackType.INDEX,
    value: 0,
  });
  const [textTracks, setTextTracks] = useState<TextTrack[]>([]);
  const [selectedTextTrack, setSelectedTextTrack] = useState<SelectedTrack>({
    type: SelectedTrackType.DISABLED,
  });
  const [selectedAudioTrackIndex, setSelectedAudioTrackIndex] = useState(0);
  const [selectedTextTrackIndex, setSelectedTextTrackIndex] = useState(1000);
  const [selectedQualityIndex, setSelectedQualityIndex] = useState(1000);
  const [externalSubs, setExternalSubs] = useState<TextTracks>([]);
  const [loading, setLoading] = useState(false);
  const [resizeMode, setResizeMode] = useState<ResizeMode>(ResizeMode.NONE);

  const [videoTracks, setVideoTracks] = useState<VideoTrack[]>([]);

  const [selectedVideoTrack, setSelectedVideoTrack] =
    useState<SelectedVideoTrack>({
      type: SelectedVideoTrackType.AUTO,
    });
  const [toastMessage, setToastMessage] = useState<string>('');
  const [showToast, setShowToast] = useState(false);

  // Add player lock state
  const [isPlayerLocked, setIsPlayerLocked] = useState(false);

  // Add new state for unlock button visibility when locked and reference for timer
  const [showUnlockButton, setShowUnlockButton] = useState(false);
  const unlockButtonTimerRef = useRef<NodeJS.Timeout | null>(null);

  // search subtitles
  const [searchQuery, setSearchQuery] = useState('');

  const [playbackRate, setPlaybackRate] = useState(1.0);

  const hasSetInitialTracksRef = useRef(false);

  // constants
  const playbacks = [0.25, 0.5, 1.0, 1.25, 1.35, 1.5, 1.75, 2];
  const excludedQualities = settingsStorage.getExcludedQualities() || [];
  const hideSeekButtons = settingsStorage.hideSeekButtons() || false;
  const enable2xGesture = settingsStorage.isEnable2xGestureEnabled() || false;
  const enableSwipeGesture = settingsStorage.isSwipeGestureEnabled();
  const showMediaControls = settingsStorage.showMediaControls();

  const watchedDuration = cacheStorage.getString(activeEpisode?.link)
    ? JSON.parse(cacheStorage.getString(activeEpisode?.link) as string).position
    : 0;
  console.log('watchedDuration', watchedDuration);

  const navigation = useNavigation();
  const remoteMediaClient = Platform.isTV ? null : useRemoteMediaClient();

  // cast
  useEffect(() => {
    if (remoteMediaClient && !Platform.isTV) {
      remoteMediaClient.loadMedia({
        startTime: watchedDuration,
        playbackRate: playbackRate,
        autoplay: true,
        mediaInfo: {
          contentUrl: selectedStream.link,
          contentType: 'video/x-matroska',
          metadata: {
            title: route.params?.primaryTitle,
            subtitle: route.params?.secondaryTitle,
            type: 'movie',
            images: [
              {
                url: route.params?.poster?.poster || '',
              },
            ],
          },
        },
      });
      playerRef?.current?.pause();
      GoogleCast.showExpandedControls();
    }
    return () => {
      if (remoteMediaClient) {
        remoteMediaClient?.stop();
      }
    };
  }, [remoteMediaClient, selectedStream]);

  // get stream
  useEffect(() => {
    setSelectedStream({server: '', link: '', type: ''});
    setExternalSubs([]);
    const controller = new AbortController();
    const fetchStream = async () => {
      console.log('activeEpisode', activeEpisode);
      setLoading(true);
      if (route.params?.directUrl) {
        setStream([
          {server: 'Downloaded', link: route.params?.directUrl, type: 'mp4'},
        ]);
        setSelectedStream({
          server: 'Downloaded',
          link: route.params?.directUrl,
          type: 'mp4',
        });
        setLoading(false);
        return;
      }
      if (route.params?.primaryTitle && route.params?.secondaryTitle) {
        const file = (
          route.params?.primaryTitle +
          route.params?.secondaryTitle +
          activeEpisode?.title
        ).replaceAll(/[^a-zA-Z0-9]/g, '_');
        const exists = await ifExists(file);
        if (exists) {
          setStream([{server: 'downloaded', link: exists, type: 'mp4'}]);
          setSelectedStream({server: 'downloaded', link: exists, type: 'mp4'});
          setLoading(false);
          return;
        }
      }
      const data = await manifest[
        route.params?.providerValue || provider?.value
      ].GetStream(activeEpisode.link, route.params?.type, controller.signal);
      const streamAbleServers = data.filter(
        // filter out non streamable servers
        streamItem =>
          !manifest[
            route.params.providerValue || provider.value
          ].nonStreamableServer?.includes(streamItem.server),
      );
      const filteredQualities = streamAbleServers?.filter(
        // filter out excluded qualities
        streamItem => !excludedQualities.includes(streamItem?.quality + 'p'),
      );
      const filteredData =
        filteredQualities?.length > 0 ? filteredQualities : streamAbleServers;
      if (filteredData.length === 0) {
        ToastAndroid.show(
          'No stream found, try again later',
          ToastAndroid.SHORT,
        );
        navigation.goBack();
        playerRef?.current?.dismissFullscreenPlayer();
      } else {
        ToastAndroid.show('Stream found, Playing...', ToastAndroid.SHORT);
      }
      setStream(filteredData);
      data?.forEach(track => {
        if (track?.subtitles?.length && track.subtitles.length > 0) {
          setExternalSubs((prev: any) => [...prev, ...(track.subtitles || [])]);
        }
      });
      setSelectedStream(filteredData[0]);
      setLoading(false);
    };
    fetchStream();

    return () => {
      controller.abort();
    };
  }, [activeEpisode, route.params?.directUrl, route.params?.episodeList]);

  // exit fullscreen on back
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      // playerRef?.current?.dismissFullscreenPlayer();
      FullScreenChz.disable();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    setSelectedAudioTrackIndex(0);
    setSelectedTextTrackIndex(1000);
    setSelectedQualityIndex(1000);
  }, [selectedStream]);

  useEffect(() => {
    setSearchQuery(route.params?.primaryTitle || '');
  }, []);

  useEffect(() => {
    if (route.params?.primaryTitle) {
      addItem({
        id: route.params.infoUrl || activeEpisode.link,
        title: route.params.primaryTitle,
        poster:
          route.params.poster?.poster || route.params.poster?.background || '',
        link: route.params.infoUrl || '',
        provider: route.params?.providerValue || provider.value,
        lastPlayed: Date.now(),
        duration: 0,
        currentTime: 0,
        playbackRate: 1,
        episodeTitle: route.params?.secondaryTitle,
      });

      // Cache the info page data
      updateItemWithInfo(
        route.params.episodeList[route.params.linkIndex].link,
        {
          ...route.params,
          cachedAt: Date.now(),
        },
      );
    }
  }, [route.params?.primaryTitle]);

  const setToast = (message: string, duration: number) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, duration);
  };

  // handle progress
  const handleProgress = useCallback(
    (e: {currentTime: number; seekableDuration: number}) => {
      const {currentTime, seekableDuration} = e;
      videoPositionRef.current = {
        position: currentTime,
        duration: seekableDuration,
      };

      // Update with correct parameters
      updatePlaybackInfo(
        route.params.episodeList[route.params.linkIndex].link,
        {
          currentTime,
          duration: seekableDuration,
          playbackRate,
        },
      );

      // Store progress data specifically for watch history display
      storeWatchProgressForHistory(
        route.params.episodeList[route.params.linkIndex].link,
        currentTime,
        seekableDuration,
      );

      if (
        Math.abs(currentTime - lastSavedPositionRef.current) > 5 ||
        currentTime - lastSavedPositionRef.current > 5
      ) {
        cacheStorage.setString(
          activeEpisode.link,
          JSON.stringify({
            position: currentTime,
            duration: seekableDuration,
          }),
        );
        lastSavedPositionRef.current = currentTime;
      }
    },
    [
      activeEpisode.link,
      route.params.episodeList,
      route.params.linkIndex,
      updatePlaybackInfo,
      playbackRate,
    ],
  );

  // Dedicated function to store watch progress for history display
  const storeWatchProgressForHistory = (
    link: string,
    currentTime: number,
    duration: number,
  ) => {
    try {
      // Only store if we have meaningful values
      if (currentTime > 0 && duration > 0) {
        // Use info URL as the primary key if available (more reliable across sessions)
        const historyKey = route.params.infoUrl || link;

        // Use a distinct key format for watch history progress data
        const historyProgressKey = `watch_history_progress_${historyKey}`;

        // Calculate percentage
        const percentage = (currentTime / duration) * 100;

        // Create rich progress data
        const progressData = {
          currentTime,
          duration,
          percentage: percentage,
          infoUrl: route.params.infoUrl || '',
          title: route.params?.primaryTitle || '',
          episodeTitle: route.params?.secondaryTitle || '',
          updatedAt: Date.now(),
        };
        // Store the data
        mainStorage.setString(historyProgressKey, JSON.stringify(progressData));

        // Log every 5 seconds to avoid too much console spam
        if (Math.floor(currentTime) % 5 === 0) {
          console.log('Watch History Progress Stored:', {
            key: historyProgressKey,
            progress: Math.round(percentage) + '%',
            time: `${Math.floor(currentTime / 60)}:${Math.floor(
              currentTime % 60,
            )
              .toString()
              .padStart(2, '0')}/${Math.floor(duration / 60)}:${Math.floor(
              duration % 60,
            )
              .toString()
              .padStart(2, '0')}`,
          });
        }

        // Also store with episodeTitle-specific key to handle series episodes
        if (route.params?.secondaryTitle) {
          const episodeKey = `watch_history_progress_${historyKey}_${route.params.secondaryTitle.replace(
            /\s+/g,
            '_',
          )}`;
          mainStorage.setString(episodeKey, JSON.stringify(progressData));
        }
      }
    } catch (error) {
      console.error('Error storing watch progress for history:', error);
    }
  };

  const handelResizeMode = () => {
    const modes = [
      {mode: ResizeMode.NONE, name: 'Fit'},
      {mode: ResizeMode.COVER, name: 'Cover'},
      {mode: ResizeMode.STRETCH, name: 'Stretch'},
      {mode: ResizeMode.CONTAIN, name: 'Contain'},
    ];
    const index = modes.findIndex(mode => mode.mode === resizeMode);
    setResizeMode(modes[(index + 1) % modes.length].mode);
    setToast(' Resize Mode: ' + modes[(index + 1) % modes.length].name, 2000);
  };

  const [isTextVisible, setIsTextVisible] = useState(false);

  // Function to toggle player lock state
  const togglePlayerLock = () => {
    const newLockState = !isPlayerLocked;
    setIsPlayerLocked(newLockState);

    // If unlocking, immediately show controls
    if (!newLockState) {
      // setShowControls(true);
    } else {
      // When locking, initially hide the unlock button
      setShowUnlockButton(false);
      playerRef?.current?.resume();
    }

    // Clear any existing timers when lock state changes
    if (unlockButtonTimerRef.current) {
      clearTimeout(unlockButtonTimerRef.current);
      unlockButtonTimerRef.current = null;
    }

    setToast(newLockState ? ' Player Locked ' : ' Player Unlocked ', 2000);
  };

  // Function to handle screen tap when locked
  const handleLockedScreenTap = () => {
    if (showUnlockButton) {
      setShowUnlockButton(false);
      return;
    }

    // Show the unlock button
    setShowUnlockButton(true);

    // Clear any existing timer
    if (unlockButtonTimerRef.current) {
      clearTimeout(unlockButtonTimerRef.current);
    }

    // Set a new timer to hide the button after 10 seconds
    unlockButtonTimerRef.current = setTimeout(() => {
      setShowUnlockButton(false);
    }, 10000); // 10 seconds
  };

  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (unlockButtonTimerRef.current) {
        clearTimeout(unlockButtonTimerRef.current);
      }
    };
  }, []);

  // set last selected audio and subtitle track
  useEffect(() => {
    if (hasSetInitialTracksRef.current) return;
    const lastAudioTrack = cacheStorage.getString('lastAudioTrack') || 'auto';
    const lastTextTrack = cacheStorage.getString('lastTextTrack') || 'auto';
    const audioTrackIndex = audioTracks.findIndex(
      track => track.language === lastAudioTrack,
    );
    const textTrackIndex = textTracks.findIndex(
      track => track.language === lastTextTrack,
    );
    if (audioTrackIndex !== -1) {
      setSelectedAudioTrack({
        type: SelectedTrackType.INDEX,
        value: audioTrackIndex,
      });
      setSelectedAudioTrackIndex(audioTrackIndex);
    }
    if (textTrackIndex !== -1) {
      setSelectedTextTrack({
        type: SelectedTrackType.INDEX,
        value: textTrackIndex,
      });
      setSelectedTextTrackIndex(textTrackIndex);
    }
    if (audioTracks.length > 0 && textTracks.length > 0) {
      hasSetInitialTracksRef.current = true;
    }
  }, [textTracks, audioTracks]);

  return (
    <SafeAreaView
      edges={{
        right: 'off',
        top: 'off',
        left: 'off',
        bottom: 'off',
      }}
      className="bg-black flex-1 relative">
      <StatusBar translucent={true} hidden={true} />
      <OrientationLocker orientation={LANDSCAPE} />
      {/* // video player */}
      <VideoPlayer
        disableGesture={isPlayerLocked || !enableSwipeGesture}
        doubleTapTime={200}
        disableSeekButtons={isPlayerLocked || hideSeekButtons}
        showOnStart={!isPlayerLocked}
        // Removed paused={isPlayerLocked ? true : undefined} - don't force pause when locked
        source={{
          textTracks: externalSubs,
          uri: selectedStream?.link || '',
          bufferConfig: {backBufferDurationMs: 30000},
          shouldCache: true,
          ...(selectedStream?.type === 'm3u8' && {type: 'm3u8'}),
          headers: selectedStream?.headers,
          metadata: {
            title: route.params?.primaryTitle,
            subtitle: activeEpisode?.title,
            artist: activeEpisode?.title,
            description: activeEpisode.title,
            imageUri: route.params?.poster?.poster,
          },
        }}
        // textTracks={externalSubs}
        onProgress={handleProgress}
        onLoad={() => {
          playerRef?.current?.seek(watchedDuration);
          playerRef?.current?.resume();
          setPlaybackRate(1.0);
          FullScreenChz.enable();
        }}
        videoRef={playerRef}
        rate={playbackRate}
        poster={{
          source: {
            ...(route.params?.poster?.logo && {
              uri: route.params?.poster?.logo,
            }),
          },
          resizeMode: 'center',
        }}
        subtitleStyle={{
          fontSize: settingsStorage.getSubtitleFontSize() || 16,
          opacity: settingsStorage.getSubtitleOpacity() || 1,
          paddingBottom: settingsStorage.getSubtitleBottomPadding() || 10,
          subtitlesFollowVideo: false,
        }}
        title={{
          primary:
            route.params?.primaryTitle &&
            route.params?.primaryTitle?.length > 70
              ? route.params?.primaryTitle.slice(0, 70) + '...'
              : route.params?.primaryTitle || '',
          secondary: activeEpisode.title,
        }}
        navigator={navigation}
        seekColor={primary}
        showDuration={true}
        toggleResizeModeOnFullscreen={false}
        // fullscreen={true}
        fullscreenOrientation="landscape"
        fullscreenAutorotate={true}
        onShowControls={() => setShowControls(true)}
        onHideControls={() => setShowControls(false)}
        rewindTime={10}
        isFullscreen={true}
        disableFullscreen={true}
        disableVolume={true}
        showHours={true}
        progressUpdateInterval={1000}
        showNotificationControls={showMediaControls}
        onError={e => {
          const serverIndex = stream.indexOf(selectedStream);
          console.log('PlayerError', e);
          if (serverIndex < stream.length - 1) {
            setSelectedStream(stream?.[serverIndex + 1]);
            ToastAndroid.show(
              'Video could not be played, Trying next server',
              ToastAndroid.SHORT,
            );
          } else {
            ToastAndroid.show(
              'Video could not be played, try again later',
              ToastAndroid.SHORT,
            );
            navigation.goBack();
          }
          setShowControls(true);
        }}
        resizeMode={resizeMode}
        selectedAudioTrack={selectedAudioTrack}
        onAudioTracks={e => {
          console.log('audioTracks', e.audioTracks);
          const uniqueMap = new Map();
          const uniqueAudioTracks = e.audioTracks.filter(track => {
            const key = `${track.type}-${track.title}-${track.language}`;
            if (!uniqueMap.has(key)) {
              uniqueMap.set(key, true);
              return true;
            }
            return false;
          });
          setAudioTracks(uniqueAudioTracks);
        }}
        selectedTextTrack={selectedTextTrack}
        onTextTracks={e => {
          console.log('textTracks', e.textTracks);
          setTextTracks(e.textTracks);
        }}
        onVideoTracks={e => {
          console.log('videoTracks', e.videoTracks);
          const uniqueMap = new Map();
          const uniqueVideoTracks = e.videoTracks.filter(track => {
            const key = `${track.bitrate}-${track.height}`;
            if (!uniqueMap.has(key)) {
              uniqueMap.set(key, true);
              return true;
            }
            return false;
          });
          setVideoTracks(uniqueVideoTracks);
        }}
        selectedVideoTrack={selectedVideoTrack}
        style={{flex: 1, zIndex: 100}}
        controlAnimationTiming={357}
        controlTimeoutDelay={10000}
        hideAllControlls={isPlayerLocked}
      />

      {/* Full-screen overlay to detect taps when locked */}
      {isPlayerLocked && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleLockedScreenTap}
          className="absolute top-0 left-0 right-0 bottom-0 z-40 bg-transparent"
        />
      )}

      {/* Lock/Unlock button - Modified to hide with controls and auto-hide in locked mode */}
      {loading === false && !Platform.isTV && (
        <MotiView
          from={{translateY: 0, opacity: 1}}
          animate={{
            translateY:
              (isPlayerLocked && showUnlockButton) ||
              (!isPlayerLocked && showControls)
                ? 0
                : -150,
            opacity:
              (isPlayerLocked && showUnlockButton) ||
              (!isPlayerLocked && showControls)
                ? 1
                : 0,
          }}
          //@ts-ignore
          transition={{
            type: 'timing',
            duration: 227,
          }}
          className="absolute top-5 right-5 flex-row items-center gap-2 z-50">
          <TouchableOpacity
            onPress={togglePlayerLock}
            className="opacity-70 p-2 rounded-full">
            <MaterialIcons
              name={isPlayerLocked ? 'lock' : 'lock-open'}
              size={24}
            />
          </TouchableOpacity>
          {/* Only show cast button when not locked */}
          {!isPlayerLocked && (
            <CastButton
              style={{width: 40, height: 40, opacity: 0.5, tintColor: 'white'}}
            />
          )}
        </MotiView>
      )}

      {/* 2x speed gesture - only visible when not locked */}
      {loading === false &&
        !Platform.isTV &&
        enable2xGesture &&
        !isPlayerLocked && (
          <TouchableOpacity
            onLongPress={() => {
              setPlaybackRate(2);
              setIsTextVisible(true);
              setToastMessage(' 2x Speed ');
              setShowToast(true);
            }}
            onPressOut={() => {
              setPlaybackRate(1.0);
              setIsTextVisible(false);
              setShowToast(false);
            }}
            className="absolute top-[20%] right-[10%] w-[15%] h-[60%] justify-center items-center">
            {isTextVisible && (
              <View className="flex flex-row items-center bg-white p-2 rounded-full">
                <MotiView
                  animate={{opacity: [1, 0, 1]}}
                  transition={{
                    repeat: Infinity,
                    duration: 300,
                    loop: true,
                    easing: Easing.inOut(Easing.ease),
                  }}>
                  <MaterialIcons name="fast-forward" size={40} color="black" />
                </MotiView>
              </View>
            )}
          </TouchableOpacity>
        )}

      {/* Bottom controls - only visible when not locked */}
      {!isPlayerLocked && (
        <MotiView
          from={{translateY: 0}}
          animate={{
            translateY: showControls ? 0 : 150,
            opacity: showControls ? 1 : 0,
          }}
          //@ts-ignore
          transition={{
            type: 'timing',
            duration: 227,
          }}
          className="absolute bottom-3 right-6 flex flex-row justify-center w-full gap-x-16">
          {/* audio  */}
          <View>
            <TouchableOpacity
              onPress={() => {
                setActiveTab('audio');
                setShowSettings(!showSettings);
              }}
              className="flex flex-row gap-x-1 items-center">
              <MaterialIcons
                style={{opacity: 0.7}}
                name={'multitrack-audio'}
                size={26}
                color="white"
              />
              <Text className="capitalize text-xs">
                {audioTracks[selectedAudioTrackIndex]?.language || 'auto'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* sub  */}
          <View>
            <TouchableOpacity
              onPress={() => {
                setActiveTab('subtitle');
                setShowSettings(!showSettings);
              }}
              className="flex flex-row gap-x-1 items-center">
              <MaterialIcons
                style={{opacity: 0.6}}
                name={'subtitles'}
                size={24}
                color="white"
              />
              <Text className="text-xs opacity-100 capitalize">
                {selectedTextTrackIndex === 1000
                  ? 'none'
                  : textTracks[selectedTextTrackIndex]?.language}
              </Text>
            </TouchableOpacity>
          </View>

          {/* speed  */}
          <View className="opacity-60">
            <TouchableOpacity
              className="flex-row gap-1 items-center"
              onPress={() => {
                setActiveTab('speed');
                setShowSettings(!showSettings);
              }}>
              <MaterialIcons style={{}} name="speed" size={26} color="white" />
              <Text className="text-white text-sm">
                {playbackRate === 1 ? '1.0' : playbackRate}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pip  */}
          {!Platform.isTV && (
            <View className="opacity-60">
              <TouchableOpacity
                className="flex-row gap-1 items-center"
                onPress={() => {
                  playerRef?.current?.enterPictureInPicture();
                }}>
                <MaterialIcons
                  name="picture-in-picture"
                  size={24}
                  color="white"
                />
                <Text className="text-white text-xs">PIP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* server & quality */}
          <View className="opacity-60">
            <TouchableOpacity
              className="flex-row gap-1 items-center"
              onPress={() => {
                setActiveTab('server');
                setShowSettings(!showSettings);
              }}>
              <MaterialIcons name="video-settings" size={25} color="white" />
              <Text className="text-xs text-white capitalize">
                {videoTracks?.length === 1
                  ? formatQuality(videoTracks[0]?.height?.toString() || 'auto')
                  : formatQuality(
                      videoTracks?.[selectedQualityIndex]?.height?.toString() ||
                        'auto',
                    )}
              </Text>
            </TouchableOpacity>
          </View>

          {/* resize button */}
          <View className="opacity-60">
            <TouchableOpacity
              className="flex-row gap-1 items-center"
              onPress={handelResizeMode}>
              <MaterialIcons name="fullscreen" size={28} color="white" />
              <Text className="text-white text-sm min-w-[38px]">
                {resizeMode === ResizeMode.NONE
                  ? 'Fit'
                  : resizeMode === ResizeMode.COVER
                  ? 'Cover'
                  : resizeMode === ResizeMode.STRETCH
                  ? 'Stretch'
                  : 'Contain'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* next episode button */}
          {route.params?.episodeList?.indexOf(activeEpisode) <
            route.params?.episodeList?.length - 1 &&
            videoPositionRef.current.position /
              videoPositionRef.current.duration >
              0.8 && (
              <View className="opacity-60">
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => {
                    const nextEpisodeIndex =
                      route.params?.episodeList.indexOf(activeEpisode);
                    if (
                      nextEpisodeIndex <
                      route.params?.episodeList?.length - 1
                    ) {
                      setActiveEpisode(
                        route.params?.episodeList[nextEpisodeIndex + 1],
                      );
                      hasSetInitialTracksRef.current = false;
                    } else {
                      ToastAndroid.show('No more episodes', ToastAndroid.SHORT);
                    }
                  }}>
                  <Text className="text-white text-base">Next</Text>
                  <MaterialIcons name="skip-next" size={28} color="white" />
                </TouchableOpacity>
              </View>
            )}
        </MotiView>
      )}

      {/* message toast - visible regardless of lock state */}
      <MotiView
        from={{opacity: 0}}
        animate={{opacity: showToast ? 1 : 0}}
        //@ts-ignore
        transition={{type: 'timing', duration: 150}}
        pointerEvents="none"
        className="absolute w-full top-12 justify-center items-center px-2">
        <Text className="text-white bg-black/50 p-2 rounded-full text-base">
          {toastMessage}
        </Text>
      </MotiView>

      {/* settings - only visible when not locked */}
      {loading === false && !isPlayerLocked && showSettings && (
        <MotiView
          from={{translateY: 0, opacity: 0}}
          animate={{
            translateY: showSettings ? 0 : 5000,
            opacity: showSettings ? 1 : 0,
          }}
          //@ts-ignore
          transition={{type: 'timing', duration: 250}}
          className="absolute opacity-0 top-0 left-0 w-full h-full bg-black/20 justify-end items-center"
          onTouchEnd={() => {
            setShowSettings(false);
            // playerRef?.current?.resume();
          }}>
          <View
            className="bg-black p-3 w-[600px] h-72 rounded-t-lg flex-row justify-start items-center"
            onTouchEnd={e => e.stopPropagation()}>
            {/* tab buttons */}
            {/* <View className="flex justify-evenly h-72 items-start border-r pb-2 border-white/10">
              {settings.map((setting, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => setActiveTab(setting.value)}
                  className="p-2 flex-row gap-2 items-center mr-4">
                  <MaterialIcons
                    name={setting.icon as any}
                    size={24}
                    color="white"
                  />
                  <Text
                    className={'text-xl capitalize font-semibold'}
                    style={{
                      color: activeTab === setting.value ? primary : 'white',
                    }}>
                    {setting.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View> */}
            {/* activeTab */}
            {/* audio */}
            {activeTab === 'audio' && (
              <ScrollView className="w-full h-full p-1 px-4">
                <Text className="text-lg font-bold text-center text-white">
                  Audio
                </Text>
                {audioTracks.length === 0 && (
                  <View className="flex justify-center items-center">
                    <Text className="text-white text-xs">
                      Loading audio tracks...
                    </Text>
                  </View>
                )}
                {audioTracks.map((track, i) => (
                  <TouchableOpacity
                    className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden ml-2"
                    key={i}
                    onPress={() => {
                      setSelectedAudioTrack({
                        type: SelectedTrackType.LANGUAGE,
                        value: track.language,
                      });
                      cacheStorage.setString(
                        'lastAudioTrack',
                        track.language || '',
                      );
                      setSelectedAudioTrackIndex(i);
                      setShowSettings(false);
                    }}>
                    <Text
                      className={'text-lg font-semibold'}
                      style={{
                        color:
                          selectedAudioTrackIndex === i ? primary : 'white',
                      }}>
                      {track.language}
                    </Text>
                    <Text
                      className={'text-base italic'}
                      style={{
                        color:
                          selectedAudioTrackIndex === i ? primary : 'white',
                      }}>
                      {track.type}
                    </Text>
                    <Text
                      className={'text-sm italic'}
                      style={{
                        color:
                          selectedAudioTrackIndex === i ? primary : 'white',
                      }}>
                      {track.title}
                    </Text>
                    {selectedAudioTrackIndex === i && (
                      <MaterialIcons name="check" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* subtitle */}
            {activeTab === 'subtitle' && (
              <FlashList
                estimatedItemSize={70}
                data={textTracks}
                ListHeaderComponent={
                  <View>
                    <Text className="text-lg font-bold text-center text-white">
                      Subtitle
                    </Text>
                    <TouchableOpacity
                      className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden ml-3"
                      onPress={() => {
                        setSelectedTextTrack({
                          type: SelectedTrackType.DISABLED,
                        });
                        setSelectedTextTrackIndex(1000);
                        cacheStorage.setString('lastTextTrack', '');
                        setShowSettings(false);
                      }}>
                      <Text
                        className="text-base font-semibold "
                        style={{
                          color:
                            selectedTextTrackIndex === 1000 ? primary : 'white',
                        }}>
                        Disabled
                      </Text>
                    </TouchableOpacity>
                  </View>
                }
                ListFooterComponent={
                  <>
                    <TouchableOpacity
                      className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden ml-2"
                      onPress={async () => {
                        try {
                          const res = await DocumentPicker.pick({
                            type: [
                              'text/vtt',
                              'application/x-subrip',
                              'text/srt',
                              'application/ttml+xml',
                            ],
                            allowMultiSelection: false,
                            presentationStyle: 'pageSheet',
                          });
                          const track = {
                            type: res?.[0]?.type as any,
                            title:
                              res?.[0]?.name && res?.[0]?.name?.length > 20
                                ? res?.[0]?.name?.slice(0, 20) + '...'
                                : res?.[0]?.name || 'undefined',
                            language: 'und',
                            uri: res?.[0]?.uri,
                          };
                          setExternalSubs((prev: any) => [track, ...prev]);
                          console.log('ExternalFile', res);
                        } catch (err) {
                          if (!isCancel(err)) {
                            console.log(err);
                          }
                        }
                      }}>
                      <MaterialIcons name="add" size={20} color="white" />
                      <Text className="text-base font-semibold text-white">
                        add external File
                      </Text>
                    </TouchableOpacity>
                    <SearchSubtitles
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      setExternalSubs={setExternalSubs}
                    />
                  </>
                }
                renderItem={({item: track}) => (
                  <TouchableOpacity
                    className={
                      'flex-row gap-3 items-center rounded-md my-1 overflow-hidden ml-2'
                    }
                    onPress={() => {
                      setSelectedTextTrack({
                        type: SelectedTrackType.INDEX,
                        value: track.index,
                      });
                      setSelectedTextTrackIndex(track.index);
                      cacheStorage.setString(
                        'lastTextTrack',
                        track.language || '',
                      );
                      setShowSettings(false);
                    }}>
                    <Text
                      className={'text-base font-semibold'}
                      style={{
                        color:
                          selectedTextTrackIndex === track.index
                            ? primary
                            : 'white',
                      }}>
                      {track.language}
                    </Text>
                    <Text
                      className={'text-sm italic'}
                      style={{
                        color:
                          selectedTextTrackIndex === track.index
                            ? primary
                            : 'white',
                      }}>
                      {track.type}
                    </Text>
                    <Text
                      className={'text-sm italic text-white'}
                      style={{
                        color:
                          selectedTextTrackIndex === track.index
                            ? primary
                            : 'white',
                      }}>
                      {track.title}
                    </Text>
                    {selectedTextTrackIndex === track.index && (
                      <MaterialIcons name="check" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}

            {/* server */}
            {activeTab === 'server' && (
              <View className="flex flex-row w-full h-full p-1 px-4">
                <ScrollView className=" border-r border-white/50">
                  <Text className="w-full text-center text-white text-lg font-extrabold">
                    Server
                  </Text>
                  {stream?.length > 0 &&
                    stream?.map((track, i) => (
                      <TouchableOpacity
                        className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden ml-2"
                        key={i}
                        onPress={() => {
                          setSelectedStream(track);
                          setShowSettings(false);
                          playerRef?.current?.resume();
                        }}>
                        <Text
                          className={'text-base capitalize font-semibold'}
                          style={{
                            color:
                              track.link === selectedStream.link
                                ? primary
                                : 'white',
                          }}>
                          {track.server}
                        </Text>
                        {track.link === selectedStream.link && (
                          <MaterialIcons name="check" size={20} color="white" />
                        )}
                      </TouchableOpacity>
                    ))}
                </ScrollView>
                <ScrollView className="">
                  <Text className="w-full text-center text-white text-lg font-extrabold">
                    Quality
                  </Text>
                  {videoTracks &&
                    videoTracks.map((track: any, i: any) => (
                      <TouchableOpacity
                        className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden ml-2"
                        key={i}
                        onPress={() => {
                          setSelectedVideoTrack({
                            type: SelectedVideoTrackType.INDEX,
                            value: track.index,
                          });
                          setSelectedQualityIndex(i);
                        }}>
                        <Text
                          className={'text-base font-semibold'}
                          style={{
                            color:
                              selectedQualityIndex === i ? primary : 'white',
                          }}>
                          {track.height + 'p'}
                        </Text>
                        <Text
                          className={'text-sm italic'}
                          style={{
                            color:
                              selectedQualityIndex === i ? primary : 'white',
                          }}>
                          {'Bitrate-' +
                            track.bitrate +
                            ' | Codec-' +
                            (track?.codecs || 'unknown')}
                        </Text>
                        {(selectedQualityIndex === i) === track.index && (
                          <MaterialIcons name="check" size={20} color="white" />
                        )}
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )}

            {/* speed */}
            {activeTab === 'speed' && (
              <ScrollView className="w-full h-full p-1 px-4">
                <Text className="text-lg font-bold text-center text-white">
                  Playback Speed
                </Text>
                {playbacks.map((track, i) => (
                  <TouchableOpacity
                    className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden ml-2"
                    key={i}
                    onPress={() => {
                      setPlaybackRate(track);
                      setShowSettings(false);
                    }}>
                    <Text
                      className={'text-lg font-semibold'}
                      style={{
                        color: playbackRate === track ? primary : 'white',
                      }}>
                      {track}x
                    </Text>
                    {playbackRate === track && (
                      <MaterialIcons name="check" size={20} color="white" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </MotiView>
      )}
    </SafeAreaView>
  );
};

export default Player;

function formatQuality(quality: string) {
  if (quality === 'auto') {
    return quality;
  }
  if (Number(quality) > 1080) {
    return '4K';
  }
  if (Number(quality) > 720) {
    return '1080p';
  }
  if (Number(quality) > 480) {
    return '720p';
  }
  if (Number(quality) > 360) {
    return '480p';
  }
  if (Number(quality) > 240) {
    return '360p';
  }
  if (Number(quality) > 144) {
    return '240p';
  }
  return quality;
}

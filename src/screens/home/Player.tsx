import {
  ScrollView,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  StatusBar,
  Platform,
} from 'react-native';
import React, {useEffect, useState, useRef} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {MMKV, MmmkvCache} from '../../lib/Mmkv';
import {OrientationLocker, LANDSCAPE} from 'react-native-orientation-locker';
import VideoPlayer from '@8man/react-native-media-console';
import {useNavigation} from '@react-navigation/native';
import {ifExists} from '../../lib/file/ifExists';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {
  VideoRef,
  AudioTrack,
  TextTrack,
  SelectedAudioTrack,
  SelectedTextTrack,
  SelectedVideoTrack,
  SelectedVideoTrackType,
  ResizeMode,
  VideoTrack,
  TextTracks,
  TextTrackType,
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

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;

type SettingsTabs = 'audio' | 'subtitle' | 'server' | 'quality' | 'speed';

const Player = ({route}: Props): React.JSX.Element => {
  const {primary} = useThemeStore(state => state);
  const {provider} = useContentStore();
  const playerRef: React.RefObject<VideoRef> = useRef(null);
  const [stream, setStream] = useState<Stream[]>([]);
  const [selectedStream, setSelectedStream] = useState<Stream>(stream[0]);

  // controls
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTabs>('audio');
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] =
    useState<SelectedAudioTrack>({type: 'index', value: '0'});
  const [textTracks, setTextTracks] = useState<TextTrack[]>([]);
  const [selectedTextTrack, setSelectedTextTrack] = useState<SelectedTextTrack>(
    {type: 'language', value: 'off'},
  );
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

  // search subtitles
  const [searchQuery, setSearchQuery] = useState('');

  const [showMediaControls] = useState(
    MMKV.getBool('showMediaControls') || true,
  );

  const [playbackRate, setPlaybackRate] = useState(1);
  const playbacks = [0.25, 0.5, 1, 1.25, 1.5, 1.75, 2];
  const settings:
    | {
        title: string;
        icon: string;
        value: SettingsTabs;
      }[] = [
    {
      title: 'Audio',
      icon: 'multitrack-audio',
      value: 'audio',
    },
    {
      title: 'Subtitle',
      icon: 'subtitles',
      value: 'subtitle',
    },
    {
      title: 'Server',
      icon: 'source',
      value: 'server',
    },
    {
      title: 'Quality',
      icon: 'video-settings',
      value: 'quality',
    },
    {
      title: 'Speed',
      icon: 'speed',
      value: 'speed',
    },
  ];
  const excludedQualities = MMKV.getArray('ExcludedQualities') || [];

  const watchedDuration = MmmkvCache.getString(route?.params?.link)
    ? JSON.parse(MmmkvCache.getString(route?.params?.link) as string).position
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
            title: route.params.primaryTitle,
            subtitle: route.params.secondaryTitle,
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
    const controller = new AbortController();
    const fetchStream = async () => {
      setLoading(true);
      // check if downloaded
      if (route.params.file) {
        const exists = await ifExists(route.params.file);
        if (exists) {
          setStream([{server: 'downloaded', link: exists, type: 'mp4'}]);
          setSelectedStream({server: 'downloaded', link: exists, type: 'mp4'});
          setLoading(false);
          return;
        }
      }
      const data = await manifest[
        route.params.providerValue || provider.value
      ].GetStream(route.params.link, route.params.type, controller.signal);
      const streamAbleServers = data.filter(
        // filter out non streamable servers
        stream =>
          !manifest[
            route.params.providerValue || provider.value
          ].nonStreamableServer?.includes(stream.server),
      );
      const filteredQualities = streamAbleServers?.filter(
        // filter out excluded qualities
        stream => !excludedQualities.includes(stream?.quality + 'p'),
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
      filteredData?.forEach(track => {
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
  }, [route.params.link]);

  // exit fullscreen on back
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      playerRef?.current?.dismissFullscreenPlayer();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    setSelectedAudioTrackIndex(0);
    setSelectedTextTrackIndex(1000);
    setSelectedQualityIndex(1000);
  }, [selectedStream]);

  useEffect(() => {
    setSearchQuery(route.params.primaryTitle || '');
  }, []);

  const setToast = (message: string, duration: number) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, duration);
  };

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
        source={{
          uri: selectedStream?.link || '',
          shouldCache: true,
          ...(selectedStream?.type === 'm3u8' && {type: 'm3u8'}),
          headers: selectedStream?.headers,
          metadata: {
            title: route.params.primaryTitle,
            subtitle: route.params.secondaryTitle,
            imageUri: route.params.poster.poster,
          },
        }}
        textTracks={externalSubs}
        onProgress={e => {
          MmmkvCache.setString(
            route.params.link,
            JSON.stringify({
              position: e.currentTime,
              duration: e.seekableDuration,
            }),
          );
          // console.log('watchedDuration', e.currentTime);
        }}
        onLoad={() => {
          playerRef?.current?.seek(watchedDuration);
          playerRef?.current?.resume();
          setPlaybackRate(1);
        }}
        videoRef={playerRef}
        rate={playbackRate}
        poster={{
          source: {
            uri:
              route?.params?.poster?.logo ||
              'https://placehold.co/600x400/000000/000000/png',
          },
          resizeMode: 'center',
        }}
        subtitleStyle={{
          paddingBottom:
            textTracks?.[Number(selectedTextTrack?.value) || 0]?.type ===
            TextTrackType.VTT
              ? 50
              : 0,
        }}
        title={{
          primary: route.params.primaryTitle || '',
          secondary: route.params.secondaryTitle,
        }}
        navigator={navigation}
        seekColor={primary}
        showDuration={true}
        toggleResizeModeOnFullscreen={false}
        fullscreen={true}
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
        bufferConfig={{backBufferDurationMs: 30000}}
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
        //@ts-ignore
        selectedAudioTrack={selectedAudioTrack}
        onAudioTracks={e => {
          console.log('audioTracks', e.audioTracks);
          setAudioTracks(e.audioTracks);
        }}
        //@ts-ignore
        selectedTextTrack={selectedTextTrack}
        onTextTracks={e => {
          setTextTracks(e.textTracks);
          console.log('textTracks', e.textTracks);
        }}
        onVideoTracks={e => {
          console.log('videoTracks', e.videoTracks);
          setVideoTracks(e.videoTracks);
        }}
        selectedVideoTrack={selectedVideoTrack}
        style={{flex: 1, zIndex: 100}}
      />

      {/* // cast button */}
      {loading === false && !Platform.isTV && (
        <MotiView
          from={{translateY: 0}}
          animate={{translateY: showControls ? 0 : -300}}
          //@ts-ignore
          transition={{type: 'timing', duration: 190}}
          className="absolute top-5 right-20">
          <CastButton
            style={{width: 40, height: 40, opacity: 0.7, tintColor: 'white'}}
          />
        </MotiView>
      )}

      {/* // settings button */}
      <MotiView
        from={{translateY: 0}}
        animate={{translateY: showControls ? 0 : -200}}
        //@ts-ignore
        transition={{type: 'timing', duration: 190}}
        className="absolute top-6 right-5">
        <TouchableOpacity
          onPress={() => {
            if (!loading) {
              setShowSettings(!showSettings);
              playerRef?.current?.pause();
            }
          }}>
          <MaterialIcons
            name="settings"
            size={30}
            color="white"
            style={{opacity: 0.5}}
          />
        </TouchableOpacity>
      </MotiView>

      {/* resize button */}
      <MotiView
        from={{translateY: 0}}
        animate={{translateY: showControls ? 0 : 150}}
        //@ts-ignore
        transition={{type: 'timing', duration: 250}}
        className="absolute bottom-4 right-6 opacity-60">
        <TouchableOpacity
          onPress={() => {
            setResizeMode(
              resizeMode === ResizeMode.NONE
                ? ResizeMode.COVER
                : ResizeMode.NONE,
            );
            setToast(
              'Resize Mode: ' +
                (resizeMode === ResizeMode.NONE ? 'Cover' : 'None'),
              2000,
            );
          }}>
          <MaterialIcons name="fullscreen" size={28} color="white" />
        </TouchableOpacity>
      </MotiView>

      {/* message toast   */}
      <MotiView
        from={{opacity: 0}}
        animate={{opacity: showToast ? 1 : 0}}
        //@ts-ignore
        transition={{type: 'timing', duration: 150}}
        pointerEvents="none"
        className="absolute w-full top-12 justify-center items-center">
        <Text className="text-white bg-black/50 p-2 rounded-md text-base">
          {toastMessage}
        </Text>
      </MotiView>
      {
        // settings
        loading === false && (
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
              playerRef?.current?.resume();
            }}>
            <View
              className="bg-black p-3 w-[600px] h-72 rounded-t-lg flex-row justify-start items-center"
              onTouchEnd={e => e.stopPropagation()}>
              {/* tab buttons */}
              <View className="flex justify-evenly h-72 items-start border-r pb-2 border-white/10">
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
              </View>
              {/* activeTab */}

              {/* audio */}
              {activeTab === 'audio' && (
                <ScrollView className="w-full h-full p-1 px-4">
                  {audioTracks.length === 0 && (
                    <View className="flex justify-center items-center h-full">
                      <Text className="text-white text-lg">
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
                          type: 'language',
                          value: track.language,
                        });
                        setSelectedAudioTrackIndex(i);
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
                    <TouchableOpacity
                      className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden ml-2"
                      onPress={() => {
                        setSelectedTextTrack({type: 'language', value: 'off'});
                        setSelectedTextTrackIndex(1000);
                      }}>
                      <Text className="text-base font-semibold text-white">
                        Disable
                      </Text>
                    </TouchableOpacity>
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
                          type: 'index',
                          value: track.index,
                        });
                        setSelectedTextTrackIndex(track.index);
                      }}>
                      <Text
                        className={'text-xl font-semibold'}
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
                <ScrollView className="w-full h-full p-1 px-4">
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
                          className={'text-lg capitalize font-semibold'}
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
              )}
              {/* quality */}
              {activeTab === 'quality' && (
                <ScrollView className="w-full h-full p-1 px-4">
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
                          className={'text-lg font-semibold'}
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
              )}
              {/* speed */}
              {activeTab === 'speed' && (
                <ScrollView className="w-full h-full p-1 px-4">
                  {playbacks.map((track, i) => (
                    <TouchableOpacity
                      className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden ml-2"
                      key={i}
                      onPress={() => {
                        setPlaybackRate(track);
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
        )
      }
    </SafeAreaView>
  );
};

export default Player;

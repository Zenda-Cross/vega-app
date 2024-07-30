import {
  ScrollView,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import React, {useEffect, useState, useRef} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {MmmkvCache} from '../../lib/Mmkv';
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
  TextTrackType,
  SelectedVideoTrack,
  SelectedVideoTrackType,
  ResizeMode,
  VideoTrack,
} from 'react-native-video';
import {MotiView} from 'moti';
import {manifest} from '../../lib/Manifest';
import useContentStore from '../../lib/zustand/contentStore';
import {CastButton, useRemoteMediaClient} from 'react-native-google-cast';
import {SafeAreaView} from 'react-native-safe-area-context';
import GoogleCast from 'react-native-google-cast';
import {Entypo} from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;
type Stream = {
  server: string;
  link: string;
  subtitles?: {
    lang: string;
    url: string;
  }[];
};

const Player = ({route}: Props): React.JSX.Element => {
  const {provider} = useContentStore();
  const playerRef: React.RefObject<VideoRef> = useRef(null);
  const [stream, setStream] = useState<Stream[]>([]);
  const [selectedStream, setSelectedStream] = useState<Stream>(stream[0]);

  // controls
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'audio' | 'subtitle' | 'server' | 'quality'
  >('audio');
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] =
    useState<SelectedAudioTrack>({type: 'index', value: '0'});
  const [textTracks, setTextTracks] = useState<TextTrack[]>([]);
  const [selectedTextTrack, setSelectedTextTrack] = useState<SelectedTextTrack>(
    {type: 'language', value: 'off'},
  );
  const [loading, setLoading] = useState(false);
  const [resizeMode, setResizeMode] = useState<ResizeMode>(ResizeMode.NONE);

  const [videoTracks, setVideoTracks] = useState<VideoTrack[]>([]);
  const [selectedVideoTrack, setSelectedVideoTrack] =
    useState<SelectedVideoTrack>({
      type: SelectedVideoTrackType.AUTO,
    });

  const [playbackRate, setPlaybackRate] = useState(1);
  const playbacks = [1, 1.25, 1.5, 1.75, 2];
  const settings:
    | {
        title: string;
        icon: string;
        value: 'audio' | 'subtitle' | 'server' | 'quality';
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
  ];

  const watchedDuration = MmmkvCache.getString(route?.params?.link)
    ? JSON.parse(MmmkvCache.getString(route?.params?.link) as string).position
    : 0;
  console.log('watchedDuration', watchedDuration);

  const navigation = useNavigation();
  const remoteMediaClient = useRemoteMediaClient();

  // cast
  useEffect(() => {
    if (remoteMediaClient) {
      remoteMediaClient.loadMedia({
        startTime: watchedDuration,
        playbackRate: playbackRate,
        autoplay: true,
        mediaInfo: {
          contentUrl: selectedStream.link,
          contentType: 'video/x-matroska',
          metadata: {
            title: route.params.title,
            type: 'movie',
            images: [
              {
                url: route.params.poster,
              },
            ],
          },
        },
      });
      playerRef?.current?.pause();
      GoogleCast.showExpandedControls();
    }
    return () => {
      remoteMediaClient?.stop();
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
          setStream([{server: 'downloaded', link: exists}]);
          setSelectedStream({server: 'downloaded', link: exists});
          setLoading(false);
          return;
        }
      }
      const data = await manifest[
        route.params.providerValue || provider.value
      ].getStream(route.params.link, route.params.type, controller.signal);
      const filteredData = data.filter(
        stream =>
          !manifest[
            route.params.providerValue || provider.value
          ].nonStreamableServer?.includes(stream.server),
      );
      // remove filepress server and hubcloud server
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
        }}
        textTracks={selectedStream?.subtitles?.map(sub => ({
          type: TextTrackType.VTT,
          title: sub.lang,
          language: sub.lang.slice(0, 2) as any,
          uri: sub.url,
        }))}
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
        }}
        videoRef={playerRef}
        rate={playbackRate}
        poster={{
          source: {
            uri:
              route?.params?.poster ||
              'https://placehold.co/600x400/000000/000000/png',
          },
          resizeMode: 'center',
        }}
        title={route.params.title}
        navigator={navigation}
        seekColor="tomato"
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
        bufferConfig={{backBufferDurationMs: 50000}}
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
        style={{flex: 1}}
      />

      {/* // cast button */}
      {loading === false && (
        <MotiView
          from={{translateY: 0}}
          animate={{translateY: showControls ? 0 : -300}}
          //@ts-ignore
          transition={{type: 'timing', duration: 260}}
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
        transition={{type: 'timing', duration: 260}}
        className="absolute top-6 right-5">
        <TouchableOpacity
          onPress={() => {
            if (!loading) {
              setShowSettings(!showSettings);
              // playerRef?.current?.pause();
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

      {/* // playback speed button */}
      <MotiView
        from={{translateY: 0}}
        animate={{translateY: showControls ? 0 : -100}}
        //@ts-ignore
        transition={{type: 'timing', duration: 260}}
        className="absolute top-5 left-24">
        <TouchableOpacity
          onPress={() => {
            const index = playbacks.indexOf(playbackRate);
            setPlaybackRate(
              index === playbacks.length - 1
                ? playbacks[0]
                : playbacks[index + 1],
            );
          }}>
          <Text className="text-white/60 text-xl font-bold">
            {playbackRate}x
          </Text>
        </TouchableOpacity>
      </MotiView>

      {/* resize button */}
      <MotiView
        from={{translateY: 0}}
        animate={{translateY: showControls ? 0 : 150}}
        //@ts-ignore
        transition={{type: 'timing', duration: 260}}
        className="absolute bottom-11 right-6 opacity-60">
        <TouchableOpacity
          onPress={() => {
            setResizeMode(
              resizeMode === ResizeMode.NONE
                ? ResizeMode.COVER
                : ResizeMode.NONE,
            );
          }}>
          {resizeMode === ResizeMode.NONE ? (
            <Entypo name="resize-full-screen" size={26} color="white" />
          ) : (
            <Entypo name="resize-100" size={26} color="white" />
          )}
        </TouchableOpacity>
      </MotiView>
      {
        // settings
        loading === false && (
          <MotiView
            from={{translateY: 0, opacity: 0}}
            animate={{
              translateY: showSettings ? 0 : 500,
              opacity: showSettings ? 1 : 0,
            }}
            //@ts-ignore
            transition={{type: 'timing', duration: 260}}
            className="absolute opacity-0 top-0 left-0 w-full h-full bg-black/20 justify-end items-center"
            onTouchEnd={() => {
              setShowSettings(false);
              // playerRef?.current?.resume();
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
                      className={`text-xl capitalize ${
                        activeTab === setting.value
                          ? 'font-bold text-primary'
                          : 'font-bold text-white'
                      }`}>
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
                        audioTracks.forEach(t => (t.selected = false));
                        track.selected = true;
                        // setShowSettings(false);
                      }}>
                      <Text
                        className={`text-lg font-semibold ${
                          track.selected ? 'text-primary' : 'text-white'
                        }`}>
                        {track.language}
                      </Text>
                      <Text
                        className={`text-base italic ${
                          track.selected ? 'text-primary' : 'text-white'
                        }`}>
                        {track.type}
                      </Text>
                      <Text
                        className={`text-sm italic ${
                          track.selected ? 'text-primary' : 'text-white'
                        }`}>
                        {track.title}
                      </Text>
                      {track.selected && (
                        <MaterialIcons name="check" size={20} color="white" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {/* subtitle */}
              {activeTab === 'subtitle' && (
                <ScrollView className="w-full h-full p-1 px-4">
                  <TouchableOpacity
                    className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden ml-2"
                    onPress={() => {
                      setSelectedTextTrack({type: 'language', value: 'off'});
                      // setShowSettings(false);
                      // playerRef?.current?.resume();
                    }}>
                    <Text className="text-base font-semibold text-white">
                      Disable
                    </Text>
                  </TouchableOpacity>
                  {textTracks.map((track, i) => (
                    <TouchableOpacity
                      className={
                        'flex-row gap-3 items-center text-primary rounded-md my-1 overflow-hidden ml-2'
                      }
                      key={i}
                      onPress={() => {
                        setSelectedTextTrack({
                          type: 'index',
                          value: track.index,
                        });
                        textTracks.forEach(t => (t.selected = false));
                        track.selected = true;
                        // setShowSettings(false);
                        // playerRef?.current?.resume();
                      }}>
                      <Text
                        className={`text-xl font-semibold ${
                          track.selected ? 'text-primary' : 'text-white'
                        }`}>
                        {track.language}
                      </Text>
                      <Text
                        className={`text-sm italic ${
                          track.selected ? 'text-primary' : 'text-white'
                        }`}>
                        {track.type}
                      </Text>
                      <Text
                        className={`text-sm italic text-white ${
                          track.selected ? 'text-primary' : 'text-white'
                        }`}>
                        {track.title}
                      </Text>
                      {track.selected && (
                        <MaterialIcons name="check" size={20} color="white" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
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
                          // playerRef?.current?.resume();
                        }}>
                        <Text
                          className={`text-lg capitalize font-semibold ${
                            track.link === selectedStream.link
                              ? 'text-primary'
                              : 'text-white'
                          }`}>
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
                          videoTracks.forEach(t => (t.selected = false));
                          track.selected = true;
                          // setShowSettings(false);
                          // playerRef?.current?.resume();
                        }}>
                        <Text
                          className={`text-lg font-semibold ${
                            selectedVideoTrack.value === track.index
                              ? 'text-primary'
                              : 'text-white'
                          }`}>
                          {track.height + 'p'}
                        </Text>
                        <Text
                          className={`text-sm italic ${
                            selectedVideoTrack.value === track.index
                              ? 'text-primary'
                              : 'text-white'
                          }`}>
                          {'Bitrate-' +
                            track.bitrate +
                            ' | Codec-' +
                            (track?.codecs || 'unknown')}
                        </Text>
                        {selectedVideoTrack.value === track.index && (
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

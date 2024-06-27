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
import VideoPlayer from 'react-native-media-console';
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
  ResizeMode,
} from 'react-native-video';
import {MotiView} from 'moti';
import {manifest} from '../../lib/Manifest';
import useContentStore from '../../lib/zustand/contentStore';
import {CastButton, useRemoteMediaClient} from 'react-native-google-cast';
import {SafeAreaView} from 'react-native-safe-area-context';
import GoogleCast from 'react-native-google-cast';
import {playerHeaders} from '../../lib/playerHeaders';

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

  const [videoTracks, setVideoTracks] = useState<any>([]);
  const [selectedVideoTrack, setSelectedVideoTrack] =
    useState<SelectedVideoTrack>({
      type: 'auto',
    });

  const [playbackRate, setPlaybackRate] = useState(1);
  const playbacks = [1, 1.25, 1.5, 1.75, 2];
  const watchedDuration = MmmkvCache.getString(route?.params?.link)
    ? JSON.parse(MmmkvCache.getString(route?.params?.link) as string).position
    : 0;

  const navigation = useNavigation();
  const remoteMediaClient = useRemoteMediaClient();

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

  let timer: NodeJS.Timeout;

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
      <VideoPlayer
        source={{
          uri: selectedStream?.link || '',
          startPosition: watchedDuration * 1000,
          headers: playerHeaders,
          shouldCache: true,
        }}
        textTracks={selectedStream?.subtitles?.map(sub => ({
          type: TextTrackType.VTT,
          title: sub.lang,
          language: sub.lang.slice(0, 2) as any,
          uri: sub.url,
        }))}
        onProgress={e => {
          clearTimeout(timer);
          timer = setTimeout(() => {
            MmmkvCache.setString(
              route.params.link,
              JSON.stringify({
                position: e.currentTime,
                duration: e.seekableDuration,
              }),
            );
            // console.log('watchedDuration', e.currentTime);
          }, 1000);
        }}
        videoRef={playerRef}
        rate={playbackRate}
        poster={route.params.poster}
        title={route.params.title}
        navigator={navigation}
        seekColor="tomato"
        showDuration={true}
        toggleResizeModeOnFullscreen={true}
        fullscreen={true}
        onShowControls={() => setShowControls(true)}
        onHideControls={() => setShowControls(false)}
        rewindTime={10}
        isFullscreen={true}
        disableVolume={true}
        showHours={true}
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
        resizeMode={ResizeMode.NONE}
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
          // className={`absolute top-8 right-5 ${
          //   showControls ? 'translate-y-0' : '-translate-y-20'
          // }`}
          onPress={() => {
            setShowSettings(!showSettings);
            // playerRef?.current?.pause();
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
      {
        // settings
        showSettings && loading === false && (
          <View
            className="absolute top-0 left-0 w-full h-full bg-black/50 justify-center items-center"
            onTouchEnd={() => {
              setShowSettings(false);
              // playerRef?.current?.resume();
            }}>
            <View
              className="bg-quaternary p-3 w-96 max-h-72 rounded-md justify-center items-center"
              onTouchEnd={e => e.stopPropagation()}>
              {/* tab buttons */}
              <View className="flex-row justify-evenly items-center w-full border-b pb-2 border-white/50">
                <TouchableOpacity onPress={() => setActiveTab('audio')}>
                  <Text
                    className={`text-lg ${
                      activeTab === 'audio'
                        ? 'font-bold text-primary'
                        : 'font-normal text-white'
                    }`}>
                    Audio
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setActiveTab('subtitle')}>
                  <Text
                    className={`text-lg ${
                      activeTab === 'subtitle'
                        ? 'font-bold text-primary'
                        : 'font-normal text-white'
                    }`}>
                    Subtitle
                  </Text>
                </TouchableOpacity>
                {videoTracks.length > 0 && (
                  <TouchableOpacity onPress={() => setActiveTab('quality')}>
                    <Text
                      className={`text-lg ${
                        activeTab === 'quality'
                          ? 'font-bold text-primary'
                          : 'font-normal text-white'
                      }`}>
                      Quality
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setActiveTab('server')}>
                  <Text
                    className={`text-lg ${
                      activeTab === 'server'
                        ? 'font-bold text-primary'
                        : 'font-normal text-white'
                    }`}>
                    Server
                  </Text>
                </TouchableOpacity>
              </View>
              {/* activeTab */}

              {/* audio */}
              {activeTab === 'audio' && (
                <ScrollView className="w-full p-1">
                  {audioTracks.map((track, i) => (
                    <TouchableOpacity
                      className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden"
                      key={i}
                      onPress={() => {
                        setSelectedAudioTrack({
                          type: 'language',
                          value: track.language,
                        });
                        setShowSettings(false);
                        // playerRef?.current?.resume();
                      }}>
                      <Text
                        className={`text-base font-semibold ${
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
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {/* subtitle */}
              {activeTab === 'subtitle' && (
                <ScrollView className="w-full p-1">
                  <TouchableOpacity
                    className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden"
                    onPress={() => {
                      setSelectedTextTrack({type: 'language', value: 'off'});
                      setShowSettings(false);
                      // playerRef?.current?.resume();
                    }}>
                    <Text className="text-base font-semibold text-white">
                      Disable
                    </Text>
                  </TouchableOpacity>
                  {textTracks.map((track, i) => (
                    <TouchableOpacity
                      className={
                        'flex-row gap-3 items-center text-primary rounded-md my-1 overflow-hidden'
                      }
                      key={i}
                      onPress={() => {
                        setSelectedTextTrack({
                          type: 'index',
                          value: track.index,
                        });
                        setShowSettings(false);
                        // playerRef?.current?.resume();
                      }}>
                      <Text
                        className={`text-base font-semibold ${
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
                        className={`text-sm italic text-white ${
                          track.selected ? 'text-primary' : 'text-white'
                        }`}>
                        {track.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {/* server */}
              {activeTab === 'server' && (
                <ScrollView className="w-full p-1">
                  {stream?.length > 0 &&
                    stream?.map((track, i) => (
                      <TouchableOpacity
                        className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden"
                        key={i}
                        onPress={() => {
                          setSelectedStream(track);
                          setShowSettings(false);
                          // playerRef?.current?.resume();
                        }}>
                        <Text
                          className={`text-base font-semibold ${
                            track.link === selectedStream.link
                              ? 'text-primary'
                              : 'text-white'
                          }`}>
                          {track.server}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              )}
              {/* quality */}
              {activeTab === 'quality' && (
                <ScrollView className="w-full p-1">
                  {videoTracks &&
                    videoTracks.map((track: any, i) => (
                      <TouchableOpacity
                        className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden"
                        key={i}
                        onPress={() => {
                          setSelectedVideoTrack({
                            type: 'index',
                            value: track.index,
                          });
                          setShowSettings(false);
                          // playerRef?.current?.resume();
                        }}>
                        <Text
                          className={`text-base font-semibold ${
                            selectedVideoTrack.value === track.index
                              ? 'text-primary'
                              : 'text-white'
                          }`}>
                          {track.height + 'p bitrate-' + track.bitrate}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              )}
            </View>
          </View>
        )
      }
    </SafeAreaView>
  );
};

export default Player;

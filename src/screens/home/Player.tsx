import {
  ScrollView,
  Text,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useState, useRef} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {MMKV, MmmkvCache} from '../../lib/Mmkv';
import {OrientationLocker, LANDSCAPE} from 'react-native-orientation-locker';
import {getStream, Stream} from '../../lib/getStream';
import VideoPlayer from 'react-native-media-console';
import {useNavigation} from '@react-navigation/native';
import {ifExists} from '../../lib/file/ifExists';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {
  VideoRef,
  AudioTrack,
  TextTrack,
  SelectedAudioTrack,
  SelectedTextTrack,
  ResizeMode,
} from 'react-native-video';
import {MotiView} from 'moti';

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;

const Player = ({route}: Props): React.JSX.Element => {
  const playerRef: React.RefObject<VideoRef> = useRef(null);
  const [stream, setStream] = useState<Stream[]>([]);
  const [selectedStream, setSelectedStream] = useState<Stream>(stream[0]);

  // controls
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'audio' | 'subtitle' | 'video'>(
    'audio',
  );
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([]);
  const [selectedAudioTrack, setSelectedAudioTrack] =
    useState<SelectedAudioTrack>({type: 'index', value: '0'});
  const [textTracks, setTextTracks] = useState<TextTrack[]>([]);
  const [selectedTextTrack, setSelectedTextTrack] = useState<SelectedTextTrack>(
    {type: 'disabled'},
  );
  const [playbackRate, setPlaybackRate] = useState(1);

  const playbacks = [1, 1.25, 1.5, 1.75, 2];

  const navigation = useNavigation();
  useEffect(() => {
    const fetchStream = async () => {
      // check if downloaded
      if (route.params.file) {
        const exists = await ifExists(route.params.file);
        if (exists) {
          setStream([{server: 'downloaded', link: exists}]);
          setSelectedStream({server: 'downloaded', link: exists});
          return;
        }
      }
      const data = await getStream(route.params.link, route.params.type);
      // remove filepress server and hubcloud server
      setStream(
        data.filter(e => e.server !== 'filepress' && e.server !== 'hubcloud'),
      );
      setSelectedStream(data.filter(item => item.server !== 'filepress')[0]);
    };
    fetchStream();
  }, [route.params.link]);

  const watchedDuration = MmmkvCache.getString(route.params.link)
    ? JSON.parse(MmmkvCache.getString(route.params.link) as string).position
    : 0;
  // console.log('watchedDuration', watchedDuration);

  let timer: NodeJS.Timeout;
  return (
    <View className="bg-black h-full w-full p-4 relative">
      <OrientationLocker orientation={LANDSCAPE} />
      <VideoPlayer
        source={{
          uri: selectedStream?.link,
          startPosition: watchedDuration * 1000,
        }}
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
        subtitleStyle={{fontSize: 20}}
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
          console.log('PlayerError', e);
          setSelectedStream(stream?.[1]);
          ToastAndroid.show(
            'Video could not be played, Trying next server',
            ToastAndroid.SHORT,
          );
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
        }}
      />

      {/* // settings button */}
      <MotiView
        from={{translateY: 0}}
        animate={{translateY: showControls ? 0 : -200}}
        transition={{type: 'timing', duration: 260}}
        className="absolute top-8 right-5">
        <TouchableOpacity
          // className={`absolute top-8 right-5 ${
          //   showControls ? 'translate-y-0' : '-translate-y-20'
          // }`}
          onPress={() => {
            setShowSettings(!showSettings);
            playerRef?.current?.pause();
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
        animate={{translateY: showControls ? 0 : -200}}
        transition={{type: 'timing', duration: 260}}
        className="absolute top-9 left-24">
        <TouchableOpacity
          onPress={() => {
            const index = playbacks.indexOf(playbackRate);
            setPlaybackRate(
              index === playbacks.length - 1
                ? playbacks[0]
                : playbacks[index + 1],
            );
          }}>
          <Text className="text-white/60 text-lg">{playbackRate}x</Text>
        </TouchableOpacity>
      </MotiView>
      {
        // settings
        showSettings && (
          <View
            className="absolute top-0 left-0 w-full h-full bg-black/50 justify-center items-center"
            onTouchEnd={() => {
              setShowSettings(false);
              playerRef?.current?.resume();
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
                <TouchableOpacity onPress={() => setActiveTab('video')}>
                  <Text
                    className={`text-lg ${
                      activeTab === 'video'
                        ? 'font-bold text-primary'
                        : 'font-normal text-white'
                    }`}>
                    Video
                  </Text>
                </TouchableOpacity>
              </View>
              {/* activeTab */}

              {/* audio */}
              {activeTab === 'audio' && (
                <ScrollView className="w-full p-3">
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
                        playerRef?.current?.resume();
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
                <ScrollView className="w-full p-3">
                  <TouchableOpacity
                    className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden"
                    onPress={() => {
                      setSelectedTextTrack({type: 'disabled'});
                      setShowSettings(false);
                      playerRef?.current?.resume();
                    }}>
                    <Text className="text-base font-semibold text-white">
                      Disabled
                    </Text>
                  </TouchableOpacity>
                  {textTracks.map((track, i) => (
                    <TouchableOpacity
                      className={
                        'flex-row gap-3 items-center text-primary rounded-md my-1 overflow-hidden'
                      }
                      key={i}
                      onPress={() => {
                        track.index === 0
                          ? setSelectedTextTrack({
                              type: 'language',
                              value: track.language,
                            })
                          : setSelectedTextTrack({
                              type: 'index',
                              value: track.index,
                            });
                        setShowSettings(false);
                        playerRef?.current?.resume();
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
              {/* video */}
              {activeTab === 'video' && (
                <ScrollView className="w-full p-3">
                  {stream.map((track, i) => (
                    <TouchableOpacity
                      className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden"
                      key={i}
                      onPress={() => {
                        setSelectedStream(track);
                        setShowSettings(false);
                        playerRef?.current?.resume();
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
            </View>
          </View>
        )
      }
    </View>
  );
};

export default Player;

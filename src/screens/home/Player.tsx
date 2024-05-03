import {View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {OrientationLocker, LANDSCAPE} from 'react-native-orientation-locker';
import {getStream} from '../../lib/getStream';
import VideoPlayer from 'react-native-media-console';
import {useNavigation} from '@react-navigation/native';
import {ifExists} from '../../lib/file/ifExists';

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;

const Player = ({route}: Props): React.JSX.Element => {
  const [stream, setStream] = useState<string[]>([]);
  const navigation = useNavigation();
  useEffect(() => {
    const fetchStream = async () => {
      // check if downloaded
      if (route.params.file) {
        const exists = await ifExists(route.params.file);
        if (exists) {
          setStream([exists]);
          return;
        }
      }
      const data = await getStream(route.params.link, route.params.type);
      setStream(data);
      // console.log('st', data);
    };
    fetchStream();
  }, [route.params.link]);
  return (
    <View className="bg-black h-full w-full p-4">
      <OrientationLocker orientation={LANDSCAPE} />
      <VideoPlayer
        source={{uri: stream[0]}}
        poster={route.params.poster}
        title={route.params.title}
        navigator={navigation}
        seekColor="tomato"
        subtitleStyle={{fontSize: 20}}
        showDuration={true}
        toggleResizeModeOnFullscreen={true}
        fullscreen={true}
        rewindTime={10}
        isFullscreen={true}
        showHours={true}
        // selectedAudioTrack={{
        //   //@ts-ignore
        //   type: 'title',
        //   value: '2',
        // }}
        onAudioTracks={e => console.log('onAudioTracks', e)}
        style={{flex: 1}}
      />
    </View>
  );
};

export default Player;

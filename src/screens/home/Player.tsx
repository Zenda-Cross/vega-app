import {View} from 'react-native';
import React, {useEffect, useState} from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {OrientationLocker, LANDSCAPE} from 'react-native-orientation-locker';
import Video from 'react-native-video';
import {getStream} from '../../lib/getStream';

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;

const Player = ({route}: Props): React.JSX.Element => {
  const [stream, setStream] = useState<string>('');
  useEffect(() => {
    const fetchStream = async () => {
      const data = await getStream(route.params.link, route.params.type);
      setStream(data);
      console.log('st', data);
    };
    fetchStream();
  }, [route.params.link]);
  return (
    <View className="bg-black h-full w-full p-4">
      <OrientationLocker orientation={LANDSCAPE} />
      <Video
        source={{uri: stream}}
        fullscreen={true}
        controls={true}
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

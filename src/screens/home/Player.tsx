import {View, Text} from 'react-native';
import React from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {OrientationLocker, LANDSCAPE} from 'react-native-orientation-locker';
import Video, {VideoRef} from 'react-native-video';
import {FullscreenOrientationType} from 'react-native-video';

type Props = NativeStackScreenProps<RootStackParamList, 'Player'>;

const Player = ({route}: Props): React.JSX.Element => {
  return (
    <View className="bg-black h-full w-full p-4">
      <OrientationLocker orientation={LANDSCAPE} />
      <Video
        source={{uri: route.params.stream}}
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

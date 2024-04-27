import {View, Text} from 'react-native';
import React from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {HomeStackParamList} from '../../App';
import {OrientationLocker, LANDSCAPE} from 'react-native-orientation-locker';

type Props = NativeStackScreenProps<HomeStackParamList, 'Player'>;

const Player = ({route}: Props): React.JSX.Element => {
  return (
    <View className="bg-black h-full w-full p-4">
      <OrientationLocker orientation={LANDSCAPE} />
      <Text>{route.params.stream}</Text>
    </View>
  );
};

export default Player;

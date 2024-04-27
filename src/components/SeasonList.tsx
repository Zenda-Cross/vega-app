import {
  View,
  Text,
  ScrollView,
  Animated,
  Platform,
  UIManager,
  LayoutAnimation,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {Link} from '../lib/getInfo';
import {getStream} from '../lib/getStream';

const SeasonList = ({LinkList}: {LinkList: Link[]}) => {
  if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }
  const [acc, setAcc] = useState<string>('');
  const [stream, setStream] = useState<string>('');
  useEffect(() => {
    const fetchStream = async () => {
      const link = await getStream(
        LinkList.find(link => link.title === acc)?.movieLinks || '',
      );
      console.log('link', link);
      setStream(link);
    };
    if (acc) {
      fetchStream();
    }
  }, [acc]);

  return (
    <ScrollView className="p-4">
      <Text className="text-white text-lg font-semibold mb-2">Seasons</Text>
      <View className="flex-row flex-wrap justify-center gap-x-2 gap-y-2">
        {LinkList.map(link => (
          <View
            className="bg-quaternary min-w-full p-2 rounded-md"
            key={link.movieLinks}>
            <Text
              className="text-white"
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut,
                );
                setAcc(acc === link.title ? '' : link.title);
              }}>
              {link.title}
            </Text>
            <Animated.ScrollView
              style={{
                maxHeight: acc === link.title ? 200 : 0,
                overflow: 'hidden',
              }}>
              <Text className="text-white">{link.movieLinks}</Text>
              <Text className="text-white">{stream}</Text>
            </Animated.ScrollView>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default SeasonList;

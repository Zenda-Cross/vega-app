import Ionicons from '@expo/vector-icons/Ionicons';
import React, {useEffect, useState} from 'react';
import {Image, View} from 'react-native';

export default function EpisodeThumbnail({
  uri,
  accentColor,
  onError,
}: {
  uri?: string;
  accentColor: string;
  onError?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);

  return uri && !failed ? (
    <Image
      source={{uri}}
      resizeMode="cover"
      resizeMethod="resize"
      onError={() => {
        setFailed(true);
        onError?.();
      }}
      style={{borderRadius: 4, height: 56, width: 88}}
    />
  ) : (
    <View
      className="items-center justify-center"
      style={{
        backgroundColor: '#171717',
        borderRadius: 4,
        height: 56,
        width: 88,
      }}>
      <Ionicons name="play-circle" size={32} color={accentColor} />
    </View>
  );
}

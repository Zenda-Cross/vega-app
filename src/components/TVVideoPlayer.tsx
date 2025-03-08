import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  BackHandler,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import Video from 'react-native-video';
import Ionicons from '@expo/vector-icons/Ionicons';
import { BlurView } from 'expo-blur';
import useThemeStore from '../lib/zustand/themeStore';

interface TVVideoPlayerProps {
  url: string;
  title: string;
  poster?: string;
  onBack: () => void;
}

const TVVideoPlayer: React.FC<TVVideoPlayerProps> = ({
  url,
  title,
  poster,
  onBack,
}) => {
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [selectedControl, setSelectedControl] = useState(0);
  const videoRef = useRef<Video>(null);
  const { primary } = useThemeStore(state => state);
  const controlTimeout = useRef<NodeJS.Timeout>();

  const controls = [
    { icon: paused ? 'play' : 'pause', action: () => setPaused(!paused) },
    { icon: 'reload', action: () => videoRef.current?.seek(0) },
    { icon: 'arrow-back', action: onBack },
  ];

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      setShowControls(true);
      resetControlsTimeout();

      switch (event.key) {
        case 'ArrowRight':
          setSelectedControl(prev => (prev + 1) % controls.length);
          break;
        case 'ArrowLeft':
          setSelectedControl(prev => (prev - 1 + controls.length) % controls.length);
          break;
        case 'Enter':
          controls[selectedControl].action();
          break;
        case 'ArrowUp':
          videoRef.current?.seek(Math.min(duration, progress + 10));
          break;
        case 'ArrowDown':
          videoRef.current?.seek(Math.max(0, progress - 10));
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [selectedControl, controls, duration, progress]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });

    return () => backHandler.remove();
  }, [onBack]);

  const resetControlsTimeout = () => {
    if (controlTimeout.current) {
      clearTimeout(controlTimeout.current);
    }
    controlTimeout.current = setTimeout(() => {
      setShowControls(false);
    }, 5000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={{ uri: url }}
        style={styles.video}
        poster={poster}
        posterResizeMode="cover"
        resizeMode="contain"
        paused={paused}
        onProgress={({ currentTime }) => setProgress(currentTime)}
        onLoad={({ duration }) => setDuration(duration)}
        repeat={false}
      />
      
      {showControls && (
        <BlurView intensity={60} style={styles.controls}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progress, { width: `${(progress / duration) * 100}%`, backgroundColor: primary }]} />
          </View>
          <Text style={styles.time}>{formatTime(progress)} / {formatTime(duration)}</Text>
          
          <View style={styles.buttons}>
            {controls.map((control, index) => (
              <TouchableOpacity
                key={control.icon}
                onPress={control.action}
                style={[
                  styles.button,
                  selectedControl === index && { borderColor: primary, borderWidth: 2 }
                ]}>
                <Ionicons
                  name={control.icon}
                  size={32}
                  color={selectedControl === index ? primary : '#fff'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </BlurView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 10,
  },
  progress: {
    height: '100%',
  },
  time: {
    color: '#fff',
    marginBottom: 20,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default TVVideoPlayer; 
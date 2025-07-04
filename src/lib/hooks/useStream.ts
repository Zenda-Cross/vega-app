import {useQuery} from '@tanstack/react-query';
import {useState, useEffect} from 'react';
import {ToastAndroid} from 'react-native';
import {providerManager} from '../services/ProviderManager';
import {settingsStorage} from '../storage';
import {ifExists} from '../file/ifExists';
import {Stream} from '../providers/types';

interface UseStreamOptions {
  activeEpisode: any;
  routeParams: any;
  provider: string;
  enabled?: boolean;
}

export const useStream = ({
  activeEpisode,
  routeParams,
  provider,
  enabled = true,
}: UseStreamOptions) => {
  const [selectedStream, setSelectedStream] = useState<Stream>({
    server: '',
    link: '',
    type: '',
  });
  const [externalSubs, setExternalSubs] = useState<any[]>([]);

  const {
    data: streamData = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Stream[], Error>({
    queryKey: ['stream', activeEpisode?.link, routeParams?.type, provider],
    queryFn: async () => {
      if (!activeEpisode?.link) {
        return [];
      }

      console.log('Fetching stream for:', activeEpisode);

      // Handle direct URL (downloaded content)
      if (routeParams?.directUrl) {
        return [
          {server: 'Downloaded', link: routeParams.directUrl, type: 'mp4'},
        ];
      }

      // Check for local downloaded file
      if (routeParams?.primaryTitle && routeParams?.secondaryTitle) {
        const file = (
          routeParams.primaryTitle +
          routeParams.secondaryTitle +
          activeEpisode.title
        ).replaceAll(/[^a-zA-Z0-9]/g, '_');

        const exists = await ifExists(file);
        if (exists) {
          return [{server: 'downloaded', link: exists, type: 'mp4'}];
        }
      }

      // Fetch streams from provider
      const controller = new AbortController();
      const data = await providerManager.getStream({
        link: activeEpisode.link,
        type: routeParams?.type,
        signal: controller.signal,
        providerValue: routeParams?.providerValue || provider,
      });

      // Filter out excluded qualities
      const excludedQualities = settingsStorage.getExcludedQualities() || [];
      const filteredQualities = data?.filter(
        streamItem => !excludedQualities.includes(streamItem?.quality + 'p'),
      );

      const filteredData =
        filteredQualities?.length > 0 ? filteredQualities : data;

      if (!filteredData || filteredData.length === 0) {
        throw new Error('No streams available');
      }

      return filteredData;
    },
    enabled: enabled && !!activeEpisode?.link,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, _error) => {
      if (failureCount >= 2) {
        return false;
      }
      return true;
    },
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Update selected stream when data changes
  useEffect(() => {
    if (streamData && streamData.length > 0) {
      setSelectedStream(streamData[0]);

      // Extract external subtitles
      const subs: any[] = [];
      streamData.forEach(track => {
        if (track?.subtitles?.length && track.subtitles.length > 0) {
          subs.push(...track.subtitles);
        }
      });
      setExternalSubs(subs);
    }
  }, [streamData]);

  // Handle errors
  useEffect(() => {
    if (error) {
      console.error('Stream fetch error:', error);
      ToastAndroid.show('No stream found, try again later', ToastAndroid.SHORT);
    }
  }, [error]);

  const switchToNextStream = () => {
    if (streamData && streamData.length > 0) {
      const currentIndex = streamData.indexOf(selectedStream);
      if (currentIndex < streamData.length - 1) {
        setSelectedStream(streamData[currentIndex + 1]);
        ToastAndroid.show(
          'Video could not be played, Trying next server',
          ToastAndroid.SHORT,
        );
        return true;
      }
    }
    return false;
  };

  return {
    streamData,
    selectedStream,
    setSelectedStream,
    externalSubs,
    setExternalSubs,
    isLoading,
    error,
    refetch,
    switchToNextStream,
  };
};

// Hook for managing video tracks and settings
export const useVideoSettings = () => {
  const [audioTracks, setAudioTracks] = useState<any[]>([]);
  const [textTracks, setTextTracks] = useState<any[]>([]);
  const [videoTracks, setVideoTracks] = useState<any[]>([]);

  const [selectedAudioTrackIndex, setSelectedAudioTrackIndex] = useState(0);
  const [selectedTextTrackIndex, setSelectedTextTrackIndex] = useState(1000);
  const [selectedQualityIndex, setSelectedQualityIndex] = useState(1000);

  const processAudioTracks = (tracks: any[]) => {
    const uniqueMap = new Map();
    const uniqueTracks = tracks.filter(track => {
      const key = `${track.type}-${track.title}-${track.language}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, true);
        return true;
      }
      return false;
    });
    setAudioTracks(uniqueTracks);
  };

  const processVideoTracks = (tracks: any[]) => {
    const uniqueMap = new Map();
    const uniqueTracks = tracks.filter(track => {
      const key = `${track.bitrate}-${track.height}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, true);
        return true;
      }
      return false;
    });
    setVideoTracks(uniqueTracks);
  };

  return {
    audioTracks,
    textTracks,
    videoTracks,
    selectedAudioTrackIndex,
    selectedTextTrackIndex,
    selectedQualityIndex,
    setAudioTracks,
    setTextTracks,
    setVideoTracks,
    setSelectedAudioTrackIndex,
    setSelectedTextTrackIndex,
    setSelectedQualityIndex,
    processAudioTracks,
    processVideoTracks,
  };
};

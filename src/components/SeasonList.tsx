import {
  View,
  Text,
  Animated,
  Platform,
  UIManager,
  LayoutAnimation,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {Link} from '../lib/getInfo';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {EpisodeLink, getEpisodeLinks} from '../lib/getEpisodesLink';
import {MotiView} from 'moti';
import {Skeleton} from 'moti/skeleton';
import {RootStackParamList} from '../App';

const SeasonList = ({
  LinkList,
  poster,
  title,
}: {
  LinkList: Link[];
  poster: string;
  title: string;
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [acc, setAcc] = useState<string>('');
  const [actEp, setActEp] = useState<string>('');
  const [episodeList, setEpisodeList] = useState<EpisodeLink[]>([]);
  const [episodeLoading, setEpisodeLoading] = useState<boolean>(false);
  useEffect(() => {
    const fetchList = async () => {
      if (!actEp) return;
      setEpisodeLoading(true);
      const episodes = await getEpisodeLinks(actEp);
      console.log(episodes);
      setEpisodeList(episodes);
      setEpisodeLoading(false);
    };
    fetchList();
  }, [actEp]);

  if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }

  return (
    <MotiView
      animate={{backgroundColor: '#0000'}}
      //@ts-ignore
      transition={{
        type: 'timing',
      }}>
      <Text className="text-white text-lg font-semibold mb-2">Streams</Text>
      <View className="flex-row flex-wrap justify-center gap-x-2 gap-y-2">
        {LinkList.map((link, i) => (
          <View
            className="bg-quaternary min-w-full p-2 rounded-md"
            key={link.title + i}>
            <Pressable
              className="text-white font-medium px-1 gap-1"
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut,
                );
                setAcc(acc === link.title ? '' : link.title);
                setActEp(link.episodesLink || '');
                actEp === link.episodesLink ? '' : setEpisodeList([]);
              }}>
              <Text className="text-primary">
                {link.title.match(/^([^{\[]+)(?=\{[^\}]+\}|\[[^\]]+\]|$)/)?.[0]}
              </Text>
              <View className="flex-row items-center gap-1">
                <Text className="text-xs">
                  {link.title.match(/{([^}]+)}/)?.[1] ||
                    link.title.match(/\[([^\]]+)\]/)?.[1]}
                </Text>
                <Text className="text-xs">
                  {'•'}
                  {link.title.match(/(\d+(?:\.\d+)?)([KMGT]B(?:\/E)?)/g)?.[0]}
                </Text>
                <Text className="text-xs">
                  {'•'}
                  {link.title.match(/\d+p\b/)?.[0]}
                </Text>
              </View>
            </Pressable>
            <Animated.ScrollView
              style={{
                maxHeight: acc === link.title ? '100%' : 0,
                overflow: 'hidden',
              }}>
              <View className="w-full justify-center items-center gap-y-2 mt-3 p-2">
                {!episodeLoading &&
                  episodeList?.length > 0 &&
                  episodeList?.map((episode, i) => (
                    <TouchableOpacity
                      key={episode.link + i}
                      className="rounded-md bg-white/30 w-[90%] h-12 justify-center items-center p-2 flex-row gap-x-2"
                      onPress={() =>
                        navigation.navigate('Player', {
                          link: episode.link,
                          type: 'series',
                          title: title + ' - ' + episode.title,
                          poster: poster,
                        })
                      }>
                      <Ionicons name="play-circle" size={28} color="tomato" />
                      <Text className="text-white">{episode.title}</Text>
                    </TouchableOpacity>
                  ))}
                {episodeLoading &&
                  [...Array(3).keys()].map(i => (
                    <View
                      key={'itm' + i}
                      style={{width: '100%', alignItems: 'center'}}>
                      <Skeleton colorMode={'dark'} width={'90%'} height={48} />
                    </View>
                  ))}
              </View>
              {link.movieLinks && (
                <View className="w-full justify-center items-center p-2">
                  <TouchableOpacity
                    className="rounded-md bg-white/30 w-[70%] h-12 justify-center items-center p-2 flex-row gap-x-2"
                    onPress={() =>
                      navigation.navigate('Player', {
                        link: link.movieLinks,
                        type: 'movie',
                        title: title,
                        poster: poster,
                      })
                    }>
                    <Ionicons name="play-circle" size={28} color="tomato" />
                    <Text className="text-white">Play</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Animated.ScrollView>
          </View>
        ))}
      </View>
    </MotiView>
  );
};

export default SeasonList;

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
import Downloader from './Downloader';
import {MmmkvCache, MMKV} from '../App';
import {Linking} from 'react-native';
import {getStream} from '../lib/getStream';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {ifExists} from '../lib/file/ifExists';

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
  const [acTitle, setAcTitle] = useState<string>('');
  const [actEp, setActEp] = useState<string>('');
  const [episodeList, setEpisodeList] = useState<EpisodeLink[]>([]);
  const [episodeLoading, setEpisodeLoading] = useState<boolean>(false);
  const [vlcLoading, setVlcLoading] = useState<boolean>(false);
  useEffect(() => {
    const fetchList = async () => {
      if (!actEp) return;
      setEpisodeLoading(true);
      const cacheEpisodes = await MmmkvCache.getItem(actEp);
      if (cacheEpisodes) {
        setEpisodeList(JSON.parse(cacheEpisodes as string));
        console.log('cache', JSON.parse(cacheEpisodes as string));
        setEpisodeLoading(false);
      }
      const episodes = await getEpisodeLinks(actEp);
      if (episodes.length === 0) return;
      MmmkvCache.setItem(actEp, JSON.stringify(episodes));
      // console.log(episodes);
      setEpisodeList(episodes);
      setEpisodeLoading(false);
    };
    fetchList();
  }, [actEp]);

  type playHandlerProps = {
    link: string;
    type: string;
    title: string;
    file: string;
  };
  const playHandler = async ({link, type, title, file}: playHandlerProps) => {
    const openVlc = MMKV.getBool('vlc');
    const downloaded = await ifExists(file);
    if (openVlc && !downloaded) {
      setVlcLoading(true);
      console.log(downloaded);
      const stream = await getStream(link, type);
      Linking.openURL('vlc://' + stream[0]);
      setVlcLoading(false);
      return;
    }
    navigation.navigate('Player', {
      link: link,
      type: type,
      title: title,
      file: file,
      poster: poster,
    });
  };

  return (
    <View>
      <Text className="text-white text-lg font-semibold mb-2">Streams</Text>
      <View className="flex-row flex-wrap justify-center gap-x-2 gap-y-2">
        {LinkList.map((link, i) => (
          <View
            className="bg-quaternary min-w-full p-2 rounded-md"
            key={link.title + i}>
            <TouchableOpacity
              className="text-white font-medium px-1 gap-1"
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut,
                );
                actEp === link.episodesLink ? '' : setEpisodeList([]);
                setActEp(link.episodesLink || '');
                setAcTitle(acTitle === link.title ? '' : link.title);
              }}>
              <Text className="text-primary">
                {link.title.match(
                  /^(?:\[?[^\[\{]+)(?=\{[^\}]+\}|\[[^\]]+\]|$)/,
                )?.[0]?.length! > 0
                  ? link.title.match(
                      /^(?:\[?[^\[\{]+)(?=\{[^\}]+\}|\[[^\]]+\]|$)/,
                    )?.[0]
                  : link.title}
              </Text>
              <View className="flex-row items-center flex-wrap gap-1">
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
            </TouchableOpacity>
            <View
              style={{
                maxHeight: acTitle === link.title ? '100%' : 0,
                overflow: 'hidden',
              }}>
              <View className="w-full justify-center items-center gap-y-2 mt-3 p-2">
                {!episodeLoading &&
                  actEp === link.episodesLink &&
                  episodeList?.length > 0 &&
                  episodeList?.map((episode, i) => (
                    <View
                      key={episode.link + i}
                      className="w-full justify-center items-center gap-2 flex-row">
                      <View className="flex-row w-full justify-between gap-2 items-center">
                        <TouchableOpacity
                          className="rounded-md bg-white/30 w-[80%] h-12 justify-center items-center p-2 flex-row gap-x-2"
                          onPress={
                            () =>
                              playHandler({
                                link: episode.link,
                                type: 'series',
                                title: title + ' ' + episode.title,
                                file:
                                  link.title
                                    .replaceAll(' ', '_')
                                    .replaceAll('/', '') +
                                  episode.title.replaceAll(' ', '_') +
                                  '.mkv',
                              })
                            // navigation.navigate('Player', {
                            //   link: episode.link,
                            //   type: 'series',
                            //   title: title,
                            //   file:
                            //     link.title
                            //       .replaceAll(' ', '_')
                            //       .replaceAll('/', '') +
                            //     episode.title.replaceAll(' ', '_') +
                            //     '.mkv',
                            //   poster: poster,
                            // })
                          }>
                          <Ionicons
                            name="play-circle"
                            size={28}
                            color="tomato"
                          />
                          <Text className="text-white">{episode.title}</Text>
                        </TouchableOpacity>
                        <Downloader
                          link={episode.link}
                          type="series"
                          fileName={
                            link.title
                              .replaceAll(' ', '_')
                              .replaceAll('/', '') +
                            episode.title.replaceAll(' ', '_') +
                            '.mkv'
                          }
                        />
                      </View>
                    </View>
                  ))}
                {episodeList.length === 0 && (
                  <MotiView
                    animate={{backgroundColor: '#0000'}}
                    delay={0}
                    //@ts-ignore
                    transition={{
                      type: 'timing',
                    }}
                    style={{
                      width: '100%',
                      height: 200,
                      alignItems: 'center',
                      gap: 5,
                    }}>
                    <Skeleton colorMode={'dark'} width={'90%'} height={48} />
                    <Skeleton colorMode={'dark'} width={'90%'} height={48} />
                    <Skeleton colorMode={'dark'} width={'90%'} height={48} />
                    <Skeleton colorMode={'dark'} width={'90%'} height={48} />
                  </MotiView>
                )}
              </View>
              {link.movieLinks && (
                <View className="w-full justify-center items-center p-2 gap-2 flex-row">
                  <View className="flex-row w-full justify-between gap-2 items-center">
                    <TouchableOpacity
                      className="rounded-md bg-white/30 w-[80%] h-12 justify-center items-center p-2 flex-row gap-x-2"
                      onPress={
                        () =>
                          playHandler({
                            link: link.movieLinks,
                            type: 'movie',
                            title: title,
                            file:
                              link.title
                                .replaceAll(' ', '_')
                                .replaceAll('/', '') + '.mkv',
                          })
                        // navigation.navigate('Player', {
                        //   link: link.movieLinks,
                        //   type: 'movie',
                        //   title: title,
                        //   file: link.title.replaceAll(' ', '_') + '.mkv',
                        //   poster: poster,
                        // })
                      }>
                      <Ionicons name="play-circle" size={28} color="tomato" />
                      <Text className="text-white">Play</Text>
                    </TouchableOpacity>
                    <Downloader
                      link={link.movieLinks}
                      type="movie"
                      fileName={link.title.replaceAll(' ', '_') + '.mkv'}
                    />
                  </View>
                </View>
              )}
            </View>
          </View>
        ))}
        {LinkList.length === 0 && (
          <Text className="text-white text-lg font-semibold min-h-20">
            No Streams Available
          </Text>
        )}
      </View>
      {vlcLoading && (
        <View className="absolute top-0 left-0 w-full h-full bg-black/60 bg-opacity-50 justify-center items-center">
          <MotiView
            // spin continuously
            from={{
              rotate: '0deg',
            }}
            animate={{
              rotate: '360deg',
            }}
            //@ts-ignore
            transition={{
              type: 'timing',
              duration: 800,
              loop: true,
              repeatReverse: false,
            }}>
            <MaterialCommunityIcons name="vlc" size={70} color="tomato" />
          </MotiView>
        </View>
      )}
    </View>
  );
};

export default SeasonList;

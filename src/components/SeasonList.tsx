import {
  View,
  Text,
  TouchableOpacity,
  ToastAndroid,
  Modal,
  FlatList,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useNavigation} from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {EpisodeLink, Link} from '../lib/providers/types';
import {MotiView} from 'moti';
import {Skeleton} from 'moti/skeleton';
import {RootStackParamList} from '../App';
import Downloader from './Downloader';
import {MMKV, MmmkvCache} from '../lib/Mmkv';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import {ifExists} from '../lib/file/ifExists';
import {Dropdown} from 'react-native-element-dropdown';
import * as IntentLauncher from 'expo-intent-launcher';
import {manifest} from '../lib/Manifest';
import RNReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Feather from '@expo/vector-icons/Feather';
import useWatchHistoryStore from '../lib/zustand/watchHistrory';
import useThemeStore from '../lib/zustand/themeStore';

const SeasonList = ({
  LinkList,
  poster,
  metaTitle,
  providerValue,
  refreshing,
  routeParams,
}: {
  LinkList: Link[];
  poster: string;
  metaTitle: string;
  providerValue: string;
  refreshing?: boolean;
  routeParams: Readonly<{
    link: string;
    provider?: string;
    poster?: string;
  }>;
}) => {
  const {primary} = useThemeStore(state => state);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  // const {provider} = useContentStore(state => state);

  const [episodeList, setEpisodeList] = useState<EpisodeLink[]>([]);
  const [episodeLoading, setEpisodeLoading] = useState<boolean>(false);
  const [vlcLoading, setVlcLoading] = useState<boolean>(false);
  const [stickyMenu, setStickyMenu] = useState<{
    active: boolean;
    link?: string;
    type?: string;
  }>({active: false});

  const [ActiveSeason, setActiveSeason] = useState<Link>(
    MmmkvCache.getMap(`ActiveSeason${metaTitle + providerValue}`) ||
      LinkList[0],
  );

  const {addItem} = useWatchHistoryStore(state => state);

  useEffect(() => {
    const fetchList = async () => {
      if (!ActiveSeason?.episodesLink) {
        return;
      }
      setEpisodeLoading(true);
      try {
        const cacheEpisodes = await MmmkvCache.getItem(
          ActiveSeason.episodesLink,
        );
        if (cacheEpisodes) {
          setEpisodeList(JSON.parse(cacheEpisodes as string));
          // console.log('cache', JSON.parse(cacheEpisodes as string));
          setEpisodeLoading(false);
        }
        const episodes = await manifest[providerValue].getEpisodeLinks(
          ActiveSeason.episodesLink,
        );
        if (episodes.length === 0) return;
        MmmkvCache.setItem(ActiveSeason.episodesLink, JSON.stringify(episodes));
        // console.log(episodes);
        setEpisodeList(episodes);
        setEpisodeLoading(false);
      } catch (e) {
        console.log(e);
        setEpisodeLoading(false);
      }
    };
    fetchList();
  }, [ActiveSeason, refreshing]);

  type playHandlerProps = {
    link: string;
    type: string;
    title: string;
    file: string;
  };
  // handle external player playback
  const handleExternalPlayer = async (link: string, type: string) => {
    setVlcLoading(true);
    const stream = await manifest[providerValue].getStream(link, type);
    const availableStream = stream.filter(
      e => !manifest[providerValue].nonStreamableServer?.includes(e.server),
    );
    if (availableStream.length === 0) {
      ToastAndroid.show('No stream available', ToastAndroid.SHORT);
    }

    const streamUrl = availableStream[0].link;
    await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
      data: streamUrl,
      type: 'video/*',
    });

    setVlcLoading(false);
    return;
  };

  const playHandler = async ({link, type, title, file}: playHandlerProps) => {
    addItem({
      link: routeParams.link,
      title: metaTitle,
      image: routeParams.poster!,
      provider: providerValue,
    });
    const externalPlayer = MMKV.getBool('useExternalPlayer');
    const downloaded = await ifExists(file);
    if (externalPlayer && !downloaded) {
      handleExternalPlayer(link, type);
      return;
    }

    navigation.navigate('Player', {
      link: link,
      type: type,
      title: title,
      file: file,
      poster: poster,
      providerValue: providerValue,
    });
  };

  const isCompleted = (link: string) => {
    const watchProgress = JSON.parse(MmmkvCache.getString(link) || '{}');
    const percentage =
      (watchProgress?.position / watchProgress?.duration) * 100;
    if (percentage > 85) {
      return true;
    } else {
      return false;
    }
  };

  // onLongPress
  const onLongPressHandler = (active: boolean, link: string, type?: string) => {
    RNReactNativeHapticFeedback.trigger('effectTick', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    setStickyMenu({active: active, link: link, type: type});
  };

  return (
    <View>
      <Dropdown
        selectedTextStyle={{color: primary, overflow: 'hidden', height: 22}}
        labelField={'title'}
        valueField={
          LinkList[0]?.movieLinks
            ? 'movieLinks'
            : LinkList[0]?.episodesLink
            ? 'episodesLink'
            : 'directLinks'
        }
        onChange={item => {
          setActiveSeason(item);
          MmmkvCache.setMap(`ActiveSeason${metaTitle + providerValue}`, item);
        }}
        value={ActiveSeason}
        data={LinkList}
        style={{overflow: 'hidden'}}
        containerStyle={{borderColor: 'black'}}
        renderItem={item => {
          return (
            <View
              className={`p-2 bg-black text-white flex-row justify-start gap-2 items-center border border-b border-gray-500 text-center ${
                ActiveSeason === item ? 'bg-quaternary' : ''
              }`}>
              <Text className=" text-white">{item.title}</Text>
            </View>
          );
        }}
      />
      <View className="flex-row flex-wrap justify-center gap-x-2 gap-y-2">
        {/* movielinks */}
        {ActiveSeason?.movieLinks && (
          <View className="w-full justify-center items-center p-2 gap-2 flex-row">
            <View
              className={`flex-row w-full justify-between gap-2 items-center 
            ${
              isCompleted(ActiveSeason.movieLinks) ||
              stickyMenu.link === ActiveSeason.movieLinks
                ? 'opacity-60'
                : ''
            }`}>
              <TouchableOpacity
                className="rounded-md bg-white/30 w-[80%] h-12 justify-center items-center p-2 flex-row gap-x-2"
                onPress={() =>
                  playHandler({
                    link: ActiveSeason.movieLinks,
                    type: 'movie',
                    title: metaTitle,
                    file: (metaTitle + ActiveSeason.quality).replaceAll(
                      /[^a-zA-Z0-9]/g,
                      '_',
                    ),
                  })
                }
                onLongPress={() =>
                  onLongPressHandler(true, ActiveSeason.movieLinks, 'movie')
                }>
                <Ionicons name="play-circle" size={28} color={primary} />
                <Text className="text-white">Play</Text>
              </TouchableOpacity>
              <Downloader
                providerValue={providerValue}
                link={ActiveSeason.movieLinks}
                title={metaTitle}
                type="movie"
                fileName={(metaTitle + ActiveSeason.quality).replaceAll(
                  /[^a-zA-Z0-9]/g,
                  '_',
                )}
              />
            </View>
          </View>
        )}
        {/* episodesLinks */}
        {
          <FlatList
            data={episodeList}
            keyExtractor={(item, index) => item.link + index}
            renderItem={({item, index}) => (
              <View
                key={item.link + index}
                className={`w-full justify-center items-center gap-2 flex-row my-1
              ${
                isCompleted(item.link) || stickyMenu.link === item.link
                  ? 'opacity-60'
                  : ''
              }
              `}>
                <View className="flex-row w-full justify-between gap-2 items-center">
                  <TouchableOpacity
                    className={
                      'rounded-md bg-white/30 w-[80%] h-12 justify-center items-center p-2 flex-row gap-x-2 relative '
                    }
                    onPress={() =>
                      playHandler({
                        link: item.link,
                        type: 'series',
                        title: metaTitle + ' ' + item.title,
                        file: (
                          metaTitle +
                          ActiveSeason.title +
                          item.title
                        ).replaceAll(/[^a-zA-Z0-9]/g, '_'),
                      })
                    }
                    onLongPress={() =>
                      onLongPressHandler(true, item.link, 'series')
                    }>
                    <Ionicons name="play-circle" size={28} color={primary} />
                    <Text className="text-white">
                      {item.title.length > 30
                        ? item.title.slice(0, 30) + '...'
                        : item.title}
                    </Text>
                  </TouchableOpacity>
                  <Downloader
                    providerValue={providerValue}
                    link={item.link}
                    type="series"
                    title={
                      metaTitle.length > 30
                        ? metaTitle.slice(0, 30) + '... ' + item.title
                        : metaTitle + ' ' + item.title
                    }
                    fileName={(
                      metaTitle +
                      ActiveSeason.title +
                      item.title
                    ).replaceAll(/[^a-zA-Z0-9]/g, '_')}
                  />
                </View>
              </View>
            )}
          />
        }
        {/* directLinks */}
        {
          <View className="w-full justify-center items-center gap-y-2 mt-3 p-2">
            <FlatList
              data={ActiveSeason?.directLinks}
              keyExtractor={(item, index) => item.link + index}
              renderItem={({item, index}) => (
                <View
                  key={item.link + index}
                  className={`w-full justify-center items-center my-2 gap-2 flex-row
                ${
                  isCompleted(item.link) || stickyMenu.link === item.link
                    ? 'opacity-60'
                    : ''
                }
                `}>
                  <View className="flex-row w-full justify-between gap-2 items-center">
                    <TouchableOpacity
                      className={
                        'rounded-md bg-white/30 w-[80%] h-12 justify-center items-center p-2 flex-row gap-x-2 relative '
                      }
                      onPress={() =>
                        playHandler({
                          link: item.link,
                          type: 'series',
                          title: metaTitle + ' ' + item.title,
                          file: (
                            metaTitle +
                            ActiveSeason.title +
                            item.title
                          ).replaceAll(/[^a-zA-Z0-9]/g, '_'),
                        })
                      }
                      onLongPress={() =>
                        onLongPressHandler(true, item.link, 'series')
                      }>
                      <Ionicons name="play-circle" size={28} color={primary} />
                      <Text className="text-white">
                        {ActiveSeason?.directLinks?.length &&
                        ActiveSeason?.directLinks?.length > 1
                          ? item.title
                          : 'Play'}
                      </Text>
                    </TouchableOpacity>
                    <Downloader
                      providerValue={providerValue}
                      link={item.link}
                      type="series"
                      title={
                        metaTitle.length > 30
                          ? metaTitle.slice(0, 30) + '... ' + item.title
                          : metaTitle + ' ' + item.title
                      }
                      fileName={(
                        metaTitle +
                        ActiveSeason.title +
                        item.title
                      ).replaceAll(/[^a-zA-Z0-9]/g, '_')}
                    />
                  </View>
                </View>
              )}
            />
          </View>
        }
        {episodeLoading && (
          <MotiView
            animate={{backgroundColor: '#0000'}}
            delay={0}
            //@ts-ignore
            transition={{
              type: 'timing',
            }}
            style={{
              width: '100%',
              padding: 10,
              alignItems: 'flex-start',
              gap: 20,
            }}>
            <Skeleton colorMode={'dark'} width={'85%'} height={48} />
            <Skeleton colorMode={'dark'} width={'85%'} height={48} />
            <Skeleton colorMode={'dark'} width={'85%'} height={48} />
            <Skeleton colorMode={'dark'} width={'85%'} height={48} />
          </MotiView>
        )}
        {LinkList?.length === 0 && (
          <Text className="text-white text-lg font-semibold min-h-20">
            No streams found
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
            <MaterialCommunityIcons name="vlc" size={70} color={primary} />
          </MotiView>
          <Text className="text-white text-lg font-semibold mt-2">
            Opening in External Player
          </Text>
        </View>
      )}
      {
        <Modal
          animationType="fade"
          className=""
          visible={stickyMenu.active}
          transparent={true}>
          <View
            className="flex-1 justify-end items-center"
            onTouchEnd={() => setStickyMenu({active: false})}>
            <View className="w-full h-14 bg-quaternary flex-row justify-evenly items-center pt-2">
              {isCompleted(stickyMenu.link || '') ? (
                <TouchableOpacity
                  className="flex-row justify-center items-center gap-2 p-2"
                  onPress={() => {
                    if (stickyMenu.link) {
                      MmmkvCache.setString(
                        stickyMenu.link,
                        JSON.stringify({
                          position: 0,
                          duration: 1,
                        }),
                      );
                      setStickyMenu({active: false});
                    }
                  }}>
                  <Text className="text-white">Marked as Unwatched</Text>
                  <Ionicons name="checkmark-done" size={30} color={primary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="flex-row justify-center items-center gap-2 pt-0 pb-2 px-2 bg-tertiary rounded-md"
                  onPress={() => {
                    if (stickyMenu.link) {
                      MmmkvCache.setString(
                        stickyMenu.link,
                        JSON.stringify({
                          position: 10000,
                          duration: 1,
                        }),
                      );
                      setStickyMenu({active: false});
                    }
                  }}>
                  <Text className="text-white">Mark as Watched</Text>
                  <Ionicons name="checkmark" size={25} color={primary} />
                </TouchableOpacity>
              )}
              {/* open in external player */}
              <TouchableOpacity
                className="flex-row justify-center bg-tertiary rounded-md items-center pt-0 pb-2 px-2 gap-2"
                onPress={() => {
                  setStickyMenu({active: false});
                  handleExternalPlayer(
                    stickyMenu.link || '',
                    stickyMenu.type || '',
                  );
                }}>
                <Text className="text-white font-bold text-base">
                  External Player
                </Text>
                <Feather name="external-link" size={20} color={primary} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      }
    </View>
  );
};

export default SeasonList;

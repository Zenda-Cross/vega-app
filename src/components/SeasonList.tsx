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
  poster: {
    logo?: string;
    poster?: string;
    background?: string;
  };
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
  const [titleSide, setTitleSide] = useState<string>('justify-center');

  const [ActiveSeason, setActiveSeason] = useState<Link>(
    MmmkvCache.getMap(`ActiveSeason${metaTitle + providerValue}`) ||
      LinkList[0],
  );

  const {addItem} = useWatchHistoryStore(state => state);

  type playHandlerProps = {
    linkIndex: number;
    type: string;
    primaryTitle: string;
    secondaryTitle?: string;
    seasonTitle: string;
    episodeList: EpisodeLink[] | Link['directLinks'];
  };
  // handle external player playback
  const handleExternalPlayer = async (link: string, type: string) => {
    setVlcLoading(true);
    const controller = new AbortController();
    const stream = await manifest[providerValue].GetStream(
      link,
      type,
      controller.signal,
    );
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

  const playHandler = async ({
    linkIndex,
    type,
    primaryTitle,
    secondaryTitle,
    seasonTitle,
    episodeList,
  }: playHandlerProps) => {
    addItem({
      link: routeParams.link,
      title: primaryTitle,
      image: poster.poster || '',
      provider: providerValue,
    });
    if (!episodeList || episodeList.length === 0) {
      return;
    }
    const link = episodeList[linkIndex].link;
    const file = (
      metaTitle +
      seasonTitle +
      episodeList[linkIndex].title
    ).replaceAll(/[^a-zA-Z0-9]/g, '_');
    const externalPlayer = MMKV.getBool('useExternalPlayer');
    const dwFile = await ifExists(file);
    if (externalPlayer) {
      if (dwFile) {
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: dwFile,
          type: 'video/*',
        });
        return;
      }
      handleExternalPlayer(link, type);
      return;
    }

    navigation.navigate('Player', {
      linkIndex,
      episodeList,
      type: type,
      directUrl: dwFile || '',
      primaryTitle: primaryTitle,
      secondaryTitle: seasonTitle,
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
        const episodes = manifest[providerValue].GetEpisodeLinks
          ? await manifest[providerValue].GetEpisodeLinks(
              ActiveSeason.episodesLink,
            )
          : [];
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
  return (
    <View>
      {LinkList.length > 1 ? (
        <Dropdown
          selectedTextStyle={{
            color: primary,
            overflow: 'hidden',
            height: 20,
            fontWeight: 'bold',
          }}
          labelField={'title'}
          valueField={
            LinkList[0]?.episodesLink ? 'episodesLink' : 'directLinks'
          }
          onChange={item => {
            setActiveSeason(item);
            MmmkvCache.setMap(`ActiveSeason${metaTitle + providerValue}`, item);
          }}
          value={ActiveSeason}
          data={LinkList}
          style={{
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#2f302f',
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: 'black',
          }}
          containerStyle={{
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: 'gray',
            borderRadius: 8,
            backgroundColor: 'black',
          }}
          renderItem={item => {
            return (
              <View
                className={`px-3 py-2 bg-black text-white flex-row justify-start items-center  border-b border-gray-500 text-center ${
                  ActiveSeason === item ? 'bg-quaternary' : ''
                }`}>
                <Text className="text-white">{item.title}</Text>
              </View>
            );
          }}
        />
      ) : (
        <Text className="text-red-600 text-lg font-semibold px-2">
          {LinkList[0]?.title}
        </Text>
      )}
      <View className="flex-row flex-wrap justify-center gap-x-2 gap-y-2">
        {/* episodesLinks */}
        {episodeList.length > 0 && !episodeLoading && (
          <FlatList
            data={episodeList}
            keyExtractor={(item, index) => item.link + index}
            renderItem={({item, index}) => {
              // set titleSide to justify-center if title is too long
              episodeList.length > 1 &&
                item.title.length > 27 &&
                setTitleSide('justify-start');
              return (
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
                      className={`rounded-md bg-white/30 w-[80%] h-12 items-center p-1 flex-row gap-x-2 relative ${titleSide}`}
                      onPress={() =>
                        playHandler({
                          linkIndex: index,
                          type: 'series',
                          primaryTitle: metaTitle,
                          secondaryTitle: item.title,
                          seasonTitle: ActiveSeason.title,
                          episodeList: episodeList,
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
              );
            }}
          />
        )}
        {/* directLinks */}
        {ActiveSeason?.directLinks &&
          ActiveSeason?.directLinks.length > 0 &&
          !episodeLoading && (
            <View className="w-full justify-center items-center gap-y-2 mt-3 p-2">
              <FlatList
                data={ActiveSeason?.directLinks}
                keyExtractor={(item, index) => item.link + index}
                renderItem={({item, index}) => {
                  // set titleSide to justify-center if title is too long
                  ActiveSeason?.directLinks?.length &&
                    ActiveSeason?.directLinks?.length > 1 &&
                    item?.title?.length > 27 &&
                    setTitleSide('justify-start');
                  return (
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
                          className={`rounded-md bg-white/30 w-[80%] h-12 items-center p-2 flex-row gap-x-2 relative ${titleSide}`}
                          onPress={() =>
                            playHandler({
                              linkIndex: index,
                              type: item.type || 'series',
                              primaryTitle: metaTitle,
                              secondaryTitle: item.title,
                              seasonTitle: ActiveSeason.title,
                              episodeList: ActiveSeason.directLinks,
                            })
                          }
                          onLongPress={() =>
                            onLongPressHandler(true, item.link, 'series')
                          }>
                          <Ionicons
                            name="play-circle"
                            size={28}
                            color={primary}
                          />
                          <Text className="text-white">
                            {ActiveSeason?.directLinks?.length &&
                            ActiveSeason?.directLinks?.length > 1
                              ? item.title?.length > 27
                                ? item.title.slice(0, 27) + '...'
                                : item.title
                              : 'Play'}
                          </Text>
                        </TouchableOpacity>
                        <Downloader
                          providerValue={providerValue}
                          link={item.link}
                          type={item.type || 'series'}
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
                  );
                }}
              />
            </View>
          )}
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
            <Skeleton colorMode={'dark'} width={'85%'} height={48} />
            <Skeleton colorMode={'dark'} width={'85%'} height={48} />
          </MotiView>
        )}
        {LinkList?.length === 0 && (
          <Text className="text-white text-lg font-semibold min-h-20">
            No stream found
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

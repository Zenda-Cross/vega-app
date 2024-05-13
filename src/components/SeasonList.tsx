import {View, Text, TouchableOpacity} from 'react-native';
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
import {Dropdown} from 'react-native-element-dropdown';

const SeasonList = ({
  LinkList,
  poster,
  metaTitle,
}: {
  LinkList: Link[];
  poster: string;
  metaTitle: string;
}) => {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [episodeList, setEpisodeList] = useState<EpisodeLink[]>([]);
  const [episodeLoading, setEpisodeLoading] = useState<boolean>(false);
  const [vlcLoading, setVlcLoading] = useState<boolean>(false);

  const [ActiveSeason, setActiveSeason] = useState<Link>(
    MmmkvCache.getMap(`ActiveSeason${metaTitle}`) || LinkList[0],
  );

  useEffect(() => {
    const fetchList = async () => {
      if (!ActiveSeason?.episodesLink) {
        return;
      }
      setEpisodeLoading(true);
      const cacheEpisodes = await MmmkvCache.getItem(ActiveSeason.episodesLink);
      if (cacheEpisodes) {
        setEpisodeList(JSON.parse(cacheEpisodes as string));
        console.log('cache', JSON.parse(cacheEpisodes as string));
        setEpisodeLoading(false);
        return;
      }
      const episodes = await getEpisodeLinks(ActiveSeason.episodesLink);
      if (episodes.length === 0) return;
      MmmkvCache.setItem(ActiveSeason.episodesLink, JSON.stringify(episodes));
      // console.log(episodes);
      setEpisodeList(episodes);
      setEpisodeLoading(false);
    };
    fetchList();
  }, [ActiveSeason]);

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
      Linking.openURL('vlc://' + stream[0].link);
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
  // console.log('LinkList', LinkList);

  return (
    <View>
      <Dropdown
        selectedTextStyle={{color: 'tomato', overflow: 'hidden', height: 23}}
        labelField={'title'}
        valueField={LinkList[0]?.movieLinks ? 'movieLinks' : 'episodesLink'}
        // excludeItems={LinkList.filter(item =>
        //   (MMKV.getArray('ExcludedQualities') || [])?.includes(item.quality),
        // )}
        onChange={item => {
          setActiveSeason(item);
          MmmkvCache.setMap(`ActiveSeason${metaTitle}`, item);
        }}
        value={ActiveSeason}
        data={LinkList}
        style={{overflow: 'hidden'}}
        containerStyle={{borderColor: 'black'}}
        renderItem={item => {
          return (
            <View className="p-2 bg-black text-white flex-row justify-start gap-2 items-center">
              <Text className=" text-white">{item.title}</Text>
            </View>
          );
        }}
      />
      <View className="flex-row flex-wrap justify-center gap-x-2 gap-y-2">
        {ActiveSeason?.movieLinks && (
          <View className="w-full justify-center items-center p-2 gap-2 flex-row">
            <View className="flex-row w-full justify-between gap-2 items-center">
              <TouchableOpacity
                className="rounded-md bg-white/30 w-[80%] h-12 justify-center items-center p-2 flex-row gap-x-2"
                onPress={() =>
                  playHandler({
                    link: ActiveSeason.movieLinks,
                    type: 'movie',
                    title: metaTitle,
                    file:
                      (metaTitle + ActiveSeason.quality).replaceAll(
                        /[^a-zA-Z0-9]/g,
                        '_',
                      ) + '.mkv',
                  })
                }>
                <Ionicons name="play-circle" size={28} color="tomato" />
                <Text className="text-white">Play</Text>
              </TouchableOpacity>
              <Downloader
                link={ActiveSeason.movieLinks}
                type="movie"
                fileName={
                  (metaTitle + ActiveSeason.quality).replaceAll(
                    /[^a-zA-Z0-9]/g,
                    '_',
                  ) + '.mkv'
                }
              />
            </View>
          </View>
        )}
        {
          <View className="w-full justify-center items-center gap-y-2 mt-3 p-2">
            {!episodeLoading &&
              episodeList?.length > 0 &&
              ActiveSeason?.episodesLink &&
              episodeList?.map((episode, i) => (
                <View
                  key={episode.link + i}
                  className="w-full justify-center items-center gap-2 flex-row">
                  <View className="flex-row w-full justify-between gap-2 items-center">
                    <TouchableOpacity
                      className="rounded-md bg-white/30 w-[80%] h-12 justify-center items-center p-2 flex-row gap-x-2"
                      onPress={() =>
                        playHandler({
                          link: episode.link,
                          type: 'series',
                          title: metaTitle + ' ' + episode.title,
                          file:
                            (
                              metaTitle +
                              ActiveSeason.title +
                              episode.title
                            ).replaceAll(/[^a-zA-Z0-9]/g, '_') + '.mkv',
                        })
                      }>
                      <Ionicons name="play-circle" size={28} color="tomato" />
                      <Text className="text-white">{episode.title}</Text>
                    </TouchableOpacity>
                    <Downloader
                      link={episode.link}
                      type="series"
                      fileName={
                        (
                          metaTitle +
                          ActiveSeason.title +
                          episode.title
                        ).replaceAll(/[^a-zA-Z0-9]/g, '_') + '.mkv'
                      }
                    />
                  </View>
                </View>
              ))}
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
          </View>
        }
        {LinkList.length === 0 && (
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
            <MaterialCommunityIcons name="vlc" size={70} color="tomato" />
          </MotiView>
          <Text className="text-white text-lg font-semibold mt-2">
            Opening in VLC
          </Text>
        </View>
      )}
    </View>
  );
};

export default SeasonList;

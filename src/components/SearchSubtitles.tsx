import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  ToastAndroid,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, {useState} from 'react';
import useThemeStore from '../lib/zustand/themeStore';
import {ScrollView} from 'react-native';
import {Dropdown} from 'react-native-element-dropdown';
import {TextTracks, TextTrackType} from 'react-native-video';

const SearchSubtitles = ({
  searchQuery,
  setSearchQuery,
  setExternalSubs,
}: {
  searchQuery: string;
  setSearchQuery: (text: string) => void;
  setExternalSubs: React.Dispatch<React.SetStateAction<TextTracks>>;
}) => {
  const {primary} = useThemeStore(state => state);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [season, setSeason] = useState('');
  const [episode, setEpisode] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [subId, setSubId] = useState('eng');

  const subLanguageIds = [
    {name: 'English', id: 'eng'},
    {name: 'Spanish', id: 'spa'},
    {name: 'French', id: 'fre'},
    {name: 'German', id: 'ger'},
    {name: 'Italian', id: 'ita'},
    {name: 'Portuguese', id: 'por'},
    {name: 'Russian', id: 'rus'},
    {name: 'Chinese', id: 'chi'},
    {name: 'Japanese', id: 'jpn'},
    {name: 'Korean', id: 'kor'},
    {name: 'Arabic', id: 'ara'},
    {name: 'Hindi', id: 'hin'},
    {name: 'Dutch', id: 'dut'},
    {name: 'Swedish', id: 'swe'},
    {name: 'Polish', id: 'pol'},
    {name: 'Turkish', id: 'tur'},
    {name: 'Danish', id: 'dan'},
    {name: 'Norwegian', id: 'nor'},
    {name: 'Finnish', id: 'fin'},
    {name: 'Vietnamese', id: 'vie'},
    {name: 'Indonesian', id: 'ind'},
  ];

  const searchSubtitles = async () => {
    try {
      setLoading(true);
      console.log(
        'openSubtitles',
        `https://rest.opensubtitles.org/search${
          episode ? '/episode-' + episode : ''
        }${
          (searchQuery?.startsWith('tt') ? '/imdbid-' : '/query-') +
          encodeURIComponent(searchQuery.toLocaleLowerCase())
        }${season ? '/season-' + season : ''}${
          subId ? '/sublanguageid-' + subId : ''
        }`,
      );
      const response = await fetch(
        `https://rest.opensubtitles.org/search${
          episode ? '/episode-' + episode : ''
        }${
          (searchQuery?.startsWith('tt') ? '/imdbid-' : '/query-') +
          encodeURIComponent(searchQuery.toLocaleLowerCase())
        }${season ? '/season-' + season : ''}${
          subId ? '/sublanguageid-' + subId : ''
        }`,
        {
          method: 'GET',
          headers: {
            'x-user-agent': 'VLSub 0.10.2',
          },
        },
      );
      console.log('openSubtitles⭐', response);
      const data = await response.json();
      setLoading(false);
      if (data?.length === 0) {
        setError('No Results Found');
        setSearchResults([]);
        return;
      }
      setSearchResults(data);
    } catch (e: any) {
      console.log('openSubtitles err', e);
      setLoading(false);
      setError(e?.message);
      ToastAndroid.show('Error fetching subtitles', ToastAndroid.SHORT);
    }
  };
  return (
    <View>
      <TouchableOpacity
        className="flex-row gap-3 items-center rounded-md my-1 overflow-hidden ml-2"
        onPress={() => setSearchModalVisible(true)}>
        <MaterialIcons name="add" size={20} color="white" />
        <Text className="text-base font-semibold text-white">
          search subtitles online
        </Text>
      </TouchableOpacity>
      <Modal
        animationType="slide"
        transparent={false}
        statusBarTranslucent={true}
        visible={searchModalVisible}
        onRequestClose={() => {
          setSearchModalVisible(!searchModalVisible);
        }}>
        <SafeAreaView className="h-full w-full bg-black bg-opacity-80">
          <View className="flex-row justify-start items-center gap-x-4 px-4 py-2">
            <MaterialIcons
              name="arrow-back-ios-new"
              size={24}
              color="white"
              onPress={() => setSearchModalVisible(false)}
            />
            <Text className="text-white text-xl font-semibold">
              Search Subtitles
            </Text>
          </View>
          <View className="flex-row justify-between items-center px-4 py-2">
            <TextInput
              placeholder="Name or IMDB ID"
              className="bg-quaternary w-[60%] rounded-md p-2 text-white"
              onChangeText={text => setSearchQuery(text)}
              value={searchQuery}
            />
            <View className="bg-quaternary w-[10%] h-11 rounded-md p-2">
              <Dropdown
                selectedTextStyle={{
                  color: 'white',
                  overflow: 'hidden',
                  fontWeight: 'bold',
                }}
                containerStyle={{
                  borderColor: '#363636',
                  width: 115,
                  paddingLeft: 5,
                  borderRadius: 5,
                  overflow: 'hidden',
                  padding: 2,
                  backgroundColor: 'black',
                  maxHeight: 450,
                }}
                labelField={'id'}
                valueField={'id'}
                placeholder="Select"
                value={subId}
                data={subLanguageIds}
                onChange={async item => {
                  setSubId(item.id);
                }}
                renderItem={({name}) => (
                  <Text className={'text-lg p-1 text-white/60 bg-black'}>
                    {name}
                  </Text>
                )}
              />
            </View>
            <TextInput
              placeholder="Season"
              keyboardType="numeric"
              className="bg-quaternary text-white w-[10%] rounded-md p-2"
              onChangeText={text => setSeason(text)}
              value={season}
            />
            <TextInput
              placeholder="Episode"
              keyboardType="numeric"
              className="bg-quaternary text-white w-[10%] rounded-md p-2"
              onChangeText={text => setEpisode(text)}
              value={episode}
            />
            <TouchableOpacity>
              <MaterialIcons
                name="search"
                size={34}
                color={primary}
                onPress={() => searchSubtitles()}
              />
            </TouchableOpacity>
          </View>
          <ScrollView
            className=" px-7 py-2"
            contentContainerStyle={{flexGrow: 1}}>
            {loading ? (
              <View className="w-full h-full justify-center items-center">
                <ActivityIndicator size="large" color={primary} />
              </View>
            ) : (
              searchResults.map((result: any) => (
                <TouchableOpacity
                  key={result?.IDSubtitleFile}
                  className="flex-row justify- items-center gap-x-4 p-2 my-1 border border-b border-white/10 rounded-md"
                  onPress={() => {
                    setSearchModalVisible(false);
                    setExternalSubs(prev => [
                      {
                        type: TextTrackType.SUBRIP,
                        language: result?.ISO639,
                        title:
                          result?.InfoReleaseGroup + ' ' + result?.UserNickName,
                        uri: result?.SubDownloadLink?.replace('.gz', ''),
                      },
                      ...prev,
                    ]);
                  }}>
                  <Text className="text-white text-lg font-semibold capitalize">
                    {result?.SubLanguageID}
                  </Text>
                  <Text className="text-white text-base">
                    {result?.MovieName?.trim()}
                  </Text>
                  <Text className="text-white text-lg">
                    {Number(result?.SeriesSeason) > 0
                      ? `S${result?.SeriesSeason}`
                      : ''}
                  </Text>
                  <Text className="text-white text-lg">
                    {Number(result?.SeriesEpisode) > 0
                      ? `E${result?.SeriesEpisode}`
                      : ''}
                  </Text>
                  <Text className="text-white text-xs italic">
                    {result?.InfoReleaseGroup + ' '}
                    {result?.UserNickName}
                  </Text>
                </TouchableOpacity>
              ))
            )}
            {searchResults.length === 0 && !loading && (
              <View className="w-full h-full justify-center items-center">
                <Text className="text-red-700 text-lg font-semibold">
                  {error}
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

export default SearchSubtitles;

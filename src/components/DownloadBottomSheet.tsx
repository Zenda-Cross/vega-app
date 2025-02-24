import {
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useEffect, useRef} from 'react';
import {Stream} from '../lib/providers/types';
import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import useThemeStore from '../lib/zustand/themeStore';
import {TextTrackType} from 'react-native-video';
import {MMKV} from '../lib/Mmkv';

type Props = {
  data: Stream[];
  loading: boolean;
  title: string;
  showModal: boolean;
  setModal: (value: boolean) => void;
  onPressVideo: (item: any) => void;
  onPressSubs: (item: any) => void;
};

const DownloadBottomSheet = ({
  data,
  loading,
  showModal,
  setModal,
  title,
  onPressSubs,
  onPressVideo,
}: Props) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const {primary} = useThemeStore(state => state);
  const [activeTab, setActiveTab] = React.useState<1 | 2>(1);

  const subtitle = data?.map(server => {
    if (server.subtitles && server.subtitles.length > 0) {
      return server.subtitles;
    }
  });

  useEffect(() => {
    if (showModal) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [showModal]);

  return (
    <Modal
      onRequestClose={() => bottomSheetRef.current?.close()}
      visible={showModal}
      transparent={true}>
      <GestureHandlerRootView style={{flex: 1}}>
        <Pressable
          onPress={() => bottomSheetRef.current?.close()}
          className="flex-1 bg-black/40">
          <BottomSheet
            enablePanDownToClose={true}
            snapPoints={['65%']}
            ref={bottomSheetRef}
            backgroundStyle={{backgroundColor: '#1a1a1a', borderRadius: 20}}
            handleIndicatorStyle={{backgroundColor: '#333'}}
            onClose={() => setModal(false)}>
            <View className="px-4 flex-row justify-between items-center">
              <Text className="text-white text-xl font-semibold">{title}</Text>
              <TouchableOpacity 
                onPress={() => bottomSheetRef.current?.close()}
                className="p-1">
                <MaterialIcons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {subtitle.length > 0 && subtitle[0] !== undefined && (
              <View className="flex-row px-4 mt-4 mb-2">
                <TouchableOpacity
                  onPress={() => setActiveTab(1)}
                  className={`px-4 py-2 rounded-full mr-2 ${
                    activeTab === 1 ? 'bg-blue-500' : 'bg-gray-700'
                  }`}>
                  <Text className="text-white font-medium">Video</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setActiveTab(2)}
                  className={`px-4 py-2 rounded-full ${
                    activeTab === 2 ? 'bg-blue-500' : 'bg-gray-700'
                  }`}>
                  <Text className="text-white font-medium">Subtitles</Text>
                </TouchableOpacity>
              </View>
            )}

            <BottomSheetScrollView className="px-4">
              {loading ? (
                <View className="p-4">
                  <Text className="text-white text-center">Loading...</Text>
                </View>
              ) : activeTab === 1 ? (
                data.map(item => (
                  <TouchableOpacity
                    key={item.link}
                    onPress={() => {
                      onPressVideo(item);
                      bottomSheetRef.current?.close();
                    }}
                    className="bg-gray-800 p-4 rounded-xl mb-3">
                    <Text className="text-white text-lg font-medium mb-1">
                      {item.server}
                    </Text>
                    <Text className="text-gray-400">
                      {item.quality || 'Unknown quality'}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                subtitle.map(subs =>
                  subs?.map(item => (
                    <TouchableOpacity
                      key={item.uri}
                      onPress={() => {
                        onPressSubs({
                          server: 'Subtitles',
                          link: item.uri,
                          type: item.type === TextTrackType.VTT ? 'vtt' : 'srt',
                          title: item.title,
                        });
                        bottomSheetRef.current?.close();
                      }}
                      className="bg-gray-800 p-4 rounded-xl mb-3">
                      <Text className="text-white text-lg font-medium">
                        {item.language}
                      </Text>
                      <Text className="text-gray-400">{item.title}</Text>
                    </TouchableOpacity>
                  ))
                )
              )}
            </BottomSheetScrollView>
          </BottomSheet>
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default DownloadBottomSheet;

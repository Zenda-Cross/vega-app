import {
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import React, {useEffect, useRef} from 'react';
import {Stream} from '../lib/providers/types';
import BottomSheet, {BottomSheetScrollView} from '@gorhom/bottom-sheet';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import SkeletonLoader from './Skeleton';

type Props = {
  data: Stream[];
  loading: boolean;
  title: string;
  showModal: boolean;
  setModal: (value: boolean) => void;
  onPress: (item: any) => void;
};
const DownloadBottomSheet = ({
  data,
  loading,
  showModal,
  setModal,
  title,
  onPress,
}: Props) => {
  const bottomSheetRef = useRef<BottomSheet>(null);
  useEffect(() => {
    if (showModal) {
      bottomSheetRef.current?.expand();
    } else {
      bottomSheetRef.current?.close();
    }
  }, [showModal]);
  return (
    <Modal
      onRequestClose={() => {
        bottomSheetRef.current?.close();
      }}
      visible={showModal}
      transparent={true}>
      <GestureHandlerRootView>
        <Pressable
          onPress={() => bottomSheetRef.current?.close()}
          className="flex-1">
          <BottomSheet
            // detached={true}
            enablePanDownToClose={true}
            snapPoints={['50%']}
            containerStyle={{marginHorizontal: 5}}
            ref={bottomSheetRef}
            backgroundStyle={{backgroundColor: '#1a1a1a'}}
            handleIndicatorStyle={{backgroundColor: '#333'}}
            onClose={() => setModal(false)}>
            <Pressable className="flex-1" onPress={e => e.stopPropagation()}>
              <Text className="text-white text-xl p-1 font-semibold text-center">
                {title}
              </Text>
              <BottomSheetScrollView
                style={{padding: 5, marginBottom: 5}}
                showsVerticalScrollIndicator={false}>
                {loading
                  ? Array.from({length: 4}).map((_, index) => (
                      <SkeletonLoader
                        key={index}
                        width={Dimensions.get('window').width - 30}
                        height={35}
                        marginVertical={5}
                      />
                    ))
                  : data.map(item => (
                      <TouchableOpacity
                        className="p-2 bg-white/30 rounded-md my-1"
                        key={item.link}
                        onPress={() => {
                          onPress(item);
                          bottomSheetRef.current?.close();
                        }}>
                        <Text style={{color: 'white'}}>{item.server}</Text>
                      </TouchableOpacity>
                    ))}
                {data.length === 0 && !loading && (
                  <Text className="text-red-500 text-lg text-center">
                    No server found
                  </Text>
                )}
              </BottomSheetScrollView>
            </Pressable>
          </BottomSheet>
        </Pressable>
      </GestureHandlerRootView>
    </Modal>
  );
};

export default DownloadBottomSheet;

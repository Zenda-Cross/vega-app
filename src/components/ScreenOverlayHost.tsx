import React, {createContext, useContext, useState} from 'react';
import {View} from 'react-native';
const ScreenOverlayContext = createContext<React.Dispatch<
  React.SetStateAction<React.ReactNode>
> | null>(null);
export const useScreenOverlay = () => useContext(ScreenOverlayContext);
export default function ScreenOverlayHost({
  children,
}: {
  children: React.ReactNode;
}) {
  const [overlay, setOverlay] = useState<React.ReactNode>(null);
  return (
    <ScreenOverlayContext.Provider value={setOverlay}>
      <View style={{flex: 1}}>
        {children}
        {overlay}
      </View>
    </ScreenOverlayContext.Provider>
  );
}

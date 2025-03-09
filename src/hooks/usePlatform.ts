import { useEffect, useState } from 'react';
import { Dimensions } from 'react-native';
import PlatformUtils from '../utils/PlatformUtils';

/**
 * Custom hook that provides platform information and responds to dimension changes.
 * This is useful for responsive layouts that need to adapt to TV vs mobile.
 */
export function usePlatform() {
  const [isTV, setIsTV] = useState(PlatformUtils.isTV);
  const [dimensions, setDimensions] = useState(Dimensions.get('window'));

  useEffect(() => {
    // Update dimensions when the screen rotates or resizes
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
      // Re-check TV status on dimension change (in case of device rotation)
      setIsTV(PlatformUtils.isTV);
    });

    return () => {
      // Clean up the event listener
      subscription.remove();
    };
  }, []);

  return {
    isTV,
    shouldUseTVLayout: PlatformUtils.shouldUseTVLayout,
    width: dimensions.width,
    height: dimensions.height,
    isLandscape: dimensions.width > dimensions.height,
  };
}

export default usePlatform; 
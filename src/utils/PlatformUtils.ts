import { Platform, Dimensions } from 'react-native';
import { NativeModules } from 'react-native';
import { MMKV } from '../lib/Mmkv';

/**
 * Enhanced Platform utility that extends React Native's Platform with additional
 * capabilities like TV detection.
 */
class PlatformUtils {
  /**
   * Detects if the app is running on a TV device.
   * 
   * This checks multiple factors:
   * 1. Platform.isTV (React Native's built-in detection)
   * 2. Platform.OS === 'android-tv' or 'tvos'
   * 3. Device model contains TV-specific keywords (for Fire TV, etc.)
   * 4. Screen dimensions (TVs typically have larger screens)
   */
  static get isTV(): boolean {
    // First check if TV mode is forced in settings
    const forceTVMode = MMKV.getBool('forceTVMode') || false;
    if (forceTVMode) {
      return true;
    }

    // Check React Native's built-in TV detection
    if (Platform.isTV) {
      return true;
    }

    // Check OS-specific TV platforms
    if (Platform.OS === 'android-tv' || Platform.OS === 'tvos') {
      return true;
    }

    // For Android, check if device model indicates a TV device
    if (Platform.OS === 'android') {
      const { UIManager } = NativeModules;
      
      // Try to get the device model from UIManager constants
      const constants = UIManager?.getConstants?.();
      const deviceModel = constants?.DeviceModel || '';
      
      // Check for common TV device keywords
      const tvKeywords = ['tv', 'firetv', 'fire tv', 'android tv', 'chromecast', 'nvidia shield'];
      if (tvKeywords.some(keyword => deviceModel.toLowerCase().includes(keyword))) {
        return true;
      }
      
      // Check if the app is running in TV mode via UI mode manager
      // This is handled by React Native's Platform.isTV, but we're being thorough
    }

    // As a fallback, check screen dimensions
    // TVs typically have larger screens, but this is not a reliable method
    const { width, height } = Dimensions.get('window');
    const screenSize = Math.sqrt(width * width + height * height);
    // This is a very rough heuristic - screens larger than 1500 pixels diagonally
    // are likely TVs or very large tablets
    if (screenSize > 1500) {
      return true;
    }

    return false;
  }

  /**
   * Determines if the app should use TV-specific layouts and behaviors.
   * 
   * This can be extended to include user preferences to force TV mode.
   */
  static get shouldUseTVLayout(): boolean {
    // For now, just use the isTV detection
    // This could be extended to check user preferences
    return this.isTV;
  }

  /**
   * Set whether to force TV mode regardless of device detection.
   * 
   * @param force Whether to force TV mode
   */
  static setForceTVMode(force: boolean): void {
    MMKV.setBool('forceTVMode', force);
  }

  /**
   * Get whether TV mode is being forced.
   */
  static get isForcingTVMode(): boolean {
    return MMKV.getBool('forceTVMode') || false;
  }
}

export default PlatformUtils; 
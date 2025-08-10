// Safe, optional accessors for react-native-firebase modules.
// They return null when the native modules aren't available (e.g., google-services.json missing).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAnalytics = (): any | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@react-native-firebase/analytics').default;
  } catch {
    return null;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCrashlytics = (): any | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require('@react-native-firebase/crashlytics').default;
  } catch {
    return null;
  }
};

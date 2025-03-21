import {Platform, PermissionsAndroid, Alert} from 'react-native';

export default async function requestStoragePermission() {
  try {
    console.log('requesting storage permission', Platform.OS, Platform.Version);
    if (Platform.OS === 'android' && Platform.Version > 29) {
      return true;
    }
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'App needs access to your storage to download files.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      Alert.alert(
        'Permission Denied',
        'Please enable storage permission in settings',
      );
    }
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
}

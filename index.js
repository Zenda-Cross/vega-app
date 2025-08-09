/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './src/App';
import notifee from '@notifee/react-native';
import notificationService from './src/lib/services/Notification';

notifee.onBackgroundEvent(async ({type, detail}) => {
  notificationService.actionHandler({type, detail});
});

AppRegistry.registerComponent('main', () => App);

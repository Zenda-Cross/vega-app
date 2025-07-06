const {withAndroidManifest} = require('@expo/config-plugins');

const withAndroidNativeConfig = config => {
  return withAndroidManifest(config, config => {
    const {manifest} = config.modResults;

    // Add Google Cast metadata
    if (manifest.application && manifest.application[0]) {
      const application = manifest.application[0];

      // Add Google Cast metadata
      if (!application['meta-data']) {
        application['meta-data'] = [];
      }

      application['meta-data'].push({
        $: {
          'android:name':
            'com.google.android.gms.cast.framework.OPTIONS_PROVIDER_CLASS_NAME',
          'android:value':
            'com.reactnative.googlecast.GoogleCastOptionsProvider',
        },
      });

      // Add Expo updates metadata
      application['meta-data'].push({
        $: {
          'android:name': 'expo.modules.updates.ENABLED',
          'android:value': 'false',
        },
      });

      application['meta-data'].push({
        $: {
          'android:name': 'expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH',
          'android:value': 'ALWAYS',
        },
      });

      application['meta-data'].push({
        $: {
          'android:name': 'expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS',
          'android:value': '0',
        },
      });

      // Add Video Playback Service
      if (!application.service) {
        application.service = [];
      }

      application.service.push({
        $: {
          'android:name': 'com.brentvatne.exoplayer.VideoPlaybackService',
          'android:exported': 'false',
          'android:foregroundServiceType': 'mediaPlayback',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'androidx.media3.session.MediaSessionService',
                },
              },
            ],
          },
        ],
      });

      // Add Google Cast activity
      if (!application.activity) {
        application.activity = [];
      }

      application.activity.push({
        $: {
          'android:name':
            'com.reactnative.googlecast.RNGCExpandedControllerActivity',
        },
      });
    }

    return config;
  });
};

module.exports = withAndroidNativeConfig;

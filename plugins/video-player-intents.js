// Kept separate from the launcher aliases so Settings can disable only Open with.
function addVideoPlayerAlias(application) {
  const aliases = application['activity-alias'] || [];
  application['activity-alias'] = aliases.filter(
    alias => alias.$?.['android:name'] !== '.VideoPlayer',
  );
  application['activity-alias'].push({
    $: {
      'android:name': '.VideoPlayer',
      'android:targetActivity': '.MainActivity',
      'android:exported': 'true',
      'android:enabled': 'true',
      'android:label': '@string/app_name',
    },
    'intent-filter': [
      {
        action: [{$: {'android:name': 'android.intent.action.VIEW'}}],
        category: [
          {$: {'android:name': 'android.intent.category.DEFAULT'}},
          {$: {'android:name': 'android.intent.category.BROWSABLE'}},
        ],
        data: [
          ...['content', 'file', 'http', 'https'].map(scheme => ({
            $: {'android:scheme': scheme},
          })),
          ...[
            'video/*',
            'application/x-mpegURL',
            'application/vnd.apple.mpegurl',
            'application/dash+xml',
          ].map(mime => ({
            $: {'android:mimeType': mime},
          })),
        ],
      },
      {
        action: [{$: {'android:name': 'android.intent.action.SEND'}}],
        category: [{$: {'android:name': 'android.intent.category.DEFAULT'}}],
        data: [{$: {'android:mimeType': 'video/*'}}],
      },
    ],
  });
}

module.exports = {addVideoPlayerAlias};

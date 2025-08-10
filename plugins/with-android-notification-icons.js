const fs = require('fs');
const path = require('path');
const {withDangerousMod} = require('@expo/config-plugins');

/**
 * Ensures ic_notification resources exist after prebuild by copying from assets/android/notification/** into
 * android/app/src/main/res/**. Ships a vector fallback if present.
 */
module.exports = function withAndroidNotificationIcons(config) {
  return withDangerousMod(config, [
    'android',
    async cfg => {
      const projectRoot = cfg.modRequest.projectRoot;
      const srcRoot = path.join(
        projectRoot,
        'assets',
        'android',
        'notification',
      );
      const destRes = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'res',
      );

      if (!fs.existsSync(srcRoot)) {
        // Nothing to copy; keep config intact
        return cfg;
      }

      const copyDir = subdir => {
        const fromDir = path.join(srcRoot, subdir);
        const toDir = path.join(destRes, subdir);
        if (!fs.existsSync(fromDir)) return;
        fs.mkdirSync(toDir, {recursive: true});
        for (const f of fs.readdirSync(fromDir)) {
          const from = path.join(fromDir, f);
          const to = path.join(toDir, f);
          if (fs.statSync(from).isFile()) {
            fs.copyFileSync(from, to);
            // If the asset was misspelled as ic_notificarion.*, also copy a corrected duplicate ic_notification.*
            if (/ic_notificarion(\.[a-z0-9]+)$/i.test(f)) {
              const ext = path.extname(f);
              const corrected = path.join(toDir, `ic_notification${ext}`);
              if (!fs.existsSync(corrected)) {
                fs.copyFileSync(from, corrected);
              }
            }
          }
        }
      };

      // Common resource buckets to copy if present
      const buckets = [
        'drawable-anydpi-v24',
        'drawable',
        'drawable-mdpi',
        'drawable-hdpi',
        'drawable-xhdpi',
        'drawable-xxhdpi',
        'drawable-xxxhdpi',
      ];
      buckets.forEach(copyDir);

      return cfg;
    },
  ]);
};

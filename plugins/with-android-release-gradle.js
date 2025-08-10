const fs = require('fs');
const path = require('path');
const {withDangerousMod} = require('@expo/config-plugins');

/**
 * Ensures custom release build logic (APK renaming and buildTypes settings) is re-applied after prebuild.
 * Adds or updates a Gradle script at android/app/with-release-config.gradle and applies it.
 */
module.exports = function withAndroidReleaseGradle(config) {
  return withDangerousMod(config, [
    'android',
    async cfg => {
      const projectRoot = cfg.modRequest.projectRoot;
      const appDir = path.join(projectRoot, 'android', 'app');
      const buildGradle = path.join(appDir, 'build.gradle');
      const helperGradle = path.join(appDir, 'with-release-config.gradle');
      const abiSplitsGradle = path.join(appDir, 'with-abi-splits.gradle');

      // Write helper gradle to add the APK rename logic if not present
      const helperContent = `// Auto-applied by with-android-release-gradle config plugin
if (project.android) {
  project.android.applicationVariants.all { variant ->
    variant.outputs.each { output ->
      project.ext { appName = 'Vega' }
      def version = variant.versionName
      def newName = output.outputFile.name
            // Keep project.ext.appName as a Gradle variable (escaped from Node template evaluation)
      newName = newName.replace("app-", "${'${'}project.ext.appName${'}'}-")
      newName = newName.replace("-release", "-v" + version)
      output.outputFileName = newName
    }
  }
}
`;
      fs.writeFileSync(helperGradle, helperContent, 'utf8');

      // Write ABI splits gradle which enforces the desired splits
      const abiSplitsContent = `// Auto-applied by with-android-release-gradle config plugin
if (project.android) {
  project.android {
    splits {
      abi {
        enable true
        reset()
        include 'armeabi-v7a', 'arm64-v8a'
        universalApk true
      }
    }
  }
}
`;
      fs.writeFileSync(abiSplitsGradle, abiSplitsContent, 'utf8');

      // Intentionally avoid modifying signing configs here to prevent AGP DSL timing issues.

      // Idempotently ensure the helper is applied in build.gradle
      let gradleText = fs.readFileSync(buildGradle, 'utf8');
      if (!gradleText.includes("apply from: 'with-release-config.gradle'")) {
        // Apply near top of file after existing plugins
        gradleText = gradleText.replace(
          /(apply plugin:[\s\S]*?\n)(?=\n|def|android\s*\{)/,
          `$1apply from: 'with-release-config.gradle'\n`,
        );
      }

      if (!gradleText.includes("apply from: 'with-abi-splits.gradle'")) {
        gradleText = gradleText.replace(
          /(apply plugin:[\s\S]*?\n)(?=\n|def|android\s*\{)/,
          `$1apply from: 'with-abi-splits.gradle'\n`,
        );
      }

      // Remove any stale apply of with-signing-config.gradle (from earlier versions)
      gradleText = gradleText.replace(
        /^apply from: 'with-signing-config.gradle'\s*\n/m,
        '',
      );

      fs.writeFileSync(buildGradle, gradleText, 'utf8');

      return cfg;
    },
  ]);
};

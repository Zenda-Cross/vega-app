# Vega TV - Android TV App

This directory contains the Android TV variant of the Vega application.

## Building the App

### Prerequisites

- Android Studio Arctic Fox (2021.3.1) or newer
- JDK 17
- Android SDK with Android TV support
- React Native development environment set up

### Setting Up Signing Keys

1. Create a keystore file for signing the app:
   ```bash
   keytool -genkey -v -keystore vega-tv-release.keystore -alias vega-tv-key -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Place the keystore file in the `app-tv` directory.

3. Update the `keystore.properties` file with your keystore information:
   ```properties
   storeFile=vega-tv-release.keystore
   storePassword=your_keystore_password
   keyAlias=vega-tv-key
   keyPassword=your_key_password
   ```

### Building APKs

#### Using Scripts

**Windows:**
```bash
.\generate_apks.bat
```

**macOS/Linux:**
```bash
./generate_apks.sh
```

#### Using Gradle Directly

**Build all APK variants:**
```bash
./gradlew generateAllApks
```

**Build App Bundle for Play Store:**
```bash
./gradlew generateAppBundle
```

**Build specific variants:**
```bash
# Full version with all architectures
./gradlew assembleFullRelease

# ARM 64-bit only version
./gradlew assembleArm64Release

# ARM 32-bit only version
./gradlew assembleArm32Release

# x86_64 only version (for emulators)
./gradlew assembleX8664Release
```

**Verify APK signing:**
```bash
./gradlew verifySignedApk
```

### Output Files

- APK files will be generated in `app-tv/build/outputs/apk/`
- App Bundle will be generated in `app-tv/build/outputs/bundle/`

## Build Variants

The app supports the following build variants:

- **full**: Includes all architectures (armeabi-v7a, arm64-v8a, x86_64)
- **arm64**: ARM 64-bit only (arm64-v8a)
- **arm32**: ARM 32-bit only (armeabi-v7a)
- **x86_64**: x86_64 only (for emulators)

Each variant can be built in debug, beta, or release mode.

## ProGuard Configuration

The app uses ProGuard for code shrinking, obfuscation, and optimization in release builds. The configuration is split into two files:

- `proguard-rules.pro`: General ProGuard rules
- `tv-proguard-rules.pro`: TV-specific ProGuard rules

## Resource Optimization

Release builds include resource optimization:

- Only English language resources are included
- Only necessary density resources are included (hdpi, xhdpi, xxhdpi, xxxhdpi)
- Unused resources are removed via shrinkResources

## App Bundle Configuration

The app supports Android App Bundle with the following splits enabled:

- Language splits
- Density splits
- ABI splits

This allows the Play Store to deliver optimized APKs to users based on their device configuration.

## TV-Specific Configurations

### Manifest Configuration

The app is configured specifically for Android TV with:

- `android:banner` attribute for TV launcher
- `android.software.leanback` feature requirement
- Disabled touchscreen requirement
- TV-specific intent filters
- TV Input Framework (TIF) integration

### UI Components

The app includes TV-specific UI components:

- Leanback-based themes and styles
- TV-specific layouts and navigation
- D-pad and remote control navigation support
- Focus-based UI elements
- TV card views and presenters

### Media Playback

The app is optimized for TV media playback:

- ExoPlayer integration with Leanback extensions
- Picture-in-Picture support
- HDMI-CEC control support
- HDR content support
- TV audio focus management

### Performance Optimization

The app includes TV-specific performance optimizations:

- Dex optimization for TV devices
- TV-specific ProGuard rules
- Resource optimization for TV screens
- Reduced logging in release builds

## Directory Structure

- `src/main/res`: Standard resources
- `src/main/res-tv`: TV-specific resources
- `src/main/AndroidManifest.xml`: TV-specific manifest

## Testing on TV Devices

1. Enable Developer Options on your Android TV
2. Enable USB Debugging
3. Connect to the TV via ADB:
   ```bash
   adb connect <TV_IP_ADDRESS>:5555
   ```
4. Install the app:
   ```bash
   adb install -r app-tv/build/outputs/apk/full/release/app-tv-full-release.apk
   ```

## Troubleshooting

If you encounter issues with the build process:

1. Check that your keystore file is correctly configured
2. Ensure all dependencies are properly installed
3. Try cleaning the project: `./gradlew clean`
4. Check the logs for specific error messages

For ADB connection issues:

1. Ensure your TV and development machine are on the same network
2. Verify that USB debugging is enabled on the TV
3. Try restarting the ADB server: `adb kill-server && adb start-server` 
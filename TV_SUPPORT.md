# Android TV Support

This document describes the Android TV support features in Vega App.

## Features

### Navigation
- D-pad navigation support for TV remotes
- Focus management for TV interface
- Menu button support for settings
- Back button handling

### Video Player
- TV-optimized video controls
- Remote control shortcuts:
  - Up/Down: Seek forward/backward
  - Left/Right: Navigate controls
  - Enter: Select/Activate
  - Back: Return to previous screen
- Auto-hiding controls
- Progress bar with time display

### Settings
- TV-specific settings menu
- Remote-friendly options
- Quick access via Menu button
- Settings include:
  - Auto Play Next Episode
  - Show Thumbnails
  - Preferred Quality
  - Clear Watch History

### UI/UX
- Large, TV-friendly interface
- Clear focus indicators
- Optimized for viewing distance
- Simplified navigation structure

## Installation

1. Download the TV-optimized APK from releases
2. Install using one of these methods:
   - ADB: `adb install vega-app-tv.apk`
   - File manager on your TV
   - Play Store (if available)

## Usage

### Remote Control Navigation
- **D-pad**: Navigate between items
- **Enter**: Select/Activate current item
- **Back**: Go back/Exit
- **Menu**: Open TV settings
- **Up/Down** (in player): Seek video
- **Left/Right** (in player): Control selection

### Video Playback
- Auto-hiding controls
- Easy quality selection
- Progress tracking
- Thumbnail previews (optional)

### Settings
Access TV-specific settings by:
1. Press Menu button on remote
2. Navigate using D-pad
3. Press Enter to toggle/select options

## Development

### Building for TV
```bash
# Clean build
cd android
./gradlew clean

# Build TV variant
./gradlew assembleRelease
```

### Testing
Test on:
- Android TV Emulator
- Physical TV devices
- Different remote controls

## Known Issues
- Some streaming sources may not be optimized for TV
- Picture-in-Picture support is limited
- Voice search integration pending

## Contributing
- Follow TV design guidelines
- Test on multiple TV devices
- Ensure D-pad navigation works
- Maintain TV-friendly UI scale 
# Android TV Support

## Overview
This PR adds comprehensive Android TV support to Vega App, making it a fully functional Android TV application with optimized UI/UX for the big screen experience.

## Features Added

### 1. TV-Optimized Video Player
- Custom video player with D-pad navigation
- Auto-hiding controls with timeout
- Large, TV-friendly control buttons
- Progress bar with time display
- Remote control shortcuts:
  - Up/Down: Seek forward/backward 10 seconds
  - Left/Right: Navigate between controls
  - Enter: Play/Pause/Select
  - Back: Return to previous screen

### 2. TV Settings Menu
- Dedicated TV settings interface
- Remote-friendly navigation
- Quick access via Menu button
- Settings include:
  - Auto Play Next Episode
  - Show Thumbnails
  - Preferred Quality Selection
  - Watch History Management

### 3. TV Navigation System
- D-pad optimized navigation
- Clear focus indicators
- Simplified menu structure
- Back button handling
- Menu button integration

### 4. Android TV Integration
- TV launcher banner
- Proper manifest declarations
- Hardware feature handling
- TV-specific layouts

## Technical Implementation

### New Components
1. `TVVideoPlayer.tsx`
   - Custom video controls
   - Remote control support
   - Progress tracking
   - Auto-hiding interface

2. `TVSettings.tsx`
   - TV-optimized settings menu
   - D-pad navigation
   - Settings persistence

3. `TVLayout.tsx`
   - TV-specific layout container
   - Focus management
   - Navigation structure

### Modified Files
1. `AndroidManifest.xml`
   - Added TV support declarations
   - Hardware feature requirements
   - Leanback launcher integration

2. `App.tsx`
   - TV mode detection
   - Conditional rendering
   - TV-specific navigation

3. `tsconfig.json`
   - Updated TypeScript configuration
   - Added necessary type definitions

## Testing
- Tested on Android TV emulator
- Verified D-pad navigation
- Tested remote control functionality
- Checked layout scaling on different TV sizes
- Verified video playback controls

## Documentation
Added comprehensive documentation in `TV_SUPPORT.md`:
- Feature documentation
- Installation guide
- Usage instructions
- Development setup
- Known limitations

## Screenshots
[Will add screenshots showing:]
1. TV Home Screen
2. Video Player Interface
3. Settings Menu
4. Navigation Focus States

## Next Steps
- Add voice search integration
- Implement picture-in-picture mode
- Add channel recommendations
- Optimize thumbnail loading for TV

## Breaking Changes
None. TV support is implemented as an additional feature without affecting existing mobile functionality.

## Dependencies Added
- @tsconfig/react-native
- Additional TV-specific configuration

## How to Test
1. Build the TV variant:
```bash
cd android
./gradlew assembleRelease
```
2. Install on Android TV or emulator
3. Test D-pad navigation
4. Verify video playback
5. Check settings functionality 
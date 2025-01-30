package com.vega
import expo.modules.ReactActivityDelegateWrapper

import android.os.Bundle
import com.zoontek.rnbootsplash.RNBootSplash
import androidx.core.view.WindowCompat
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Vega"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      ReactActivityDelegateWrapper(this, BuildConfig.IS_NEW_ARCHITECTURE_ENABLED, DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled))
  
   override fun onCreate(savedInstanceState: Bundle?) {
    RNBootSplash.init(this, R.style.BootTheme) // ⬅️ initialize the splash screen
    // @generated begin bootsplash-init - expo prebuild (DO NOT MODIFY) sync-f0f7dbc46f1d82498f47676b4197e1949dc7790f
    RNBootSplash.init(this, R.style.BootTheme)
    // @generated end bootsplash-init
    super.onCreate(null)
    WindowCompat.setDecorFitsSystemWindows(window, false)
  }
}

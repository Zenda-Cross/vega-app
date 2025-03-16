package com.vega.tv

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

/**
 * Main activity for the TV app
 */
class MainActivity : ReactActivity() {
    
    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    override fun getMainComponentName(): String = "VegaTV"
    
    /**
     * Returns the instance of the [ReactActivityDelegate]. We use
     * [DefaultReactActivityDelegate] which allows you to enable New Architecture with a single
     * boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // TV apps should not use the default transition animation
        overridePendingTransition(0, 0)
    }
    
    override fun onPause() {
        super.onPause()
        // Disable transition animations when pausing
        overridePendingTransition(0, 0)
    }
    
    override fun onResume() {
        super.onResume()
        // Disable transition animations when resuming
        overridePendingTransition(0, 0)
    }
} 
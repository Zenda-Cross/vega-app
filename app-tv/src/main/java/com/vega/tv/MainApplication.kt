package com.vega.tv

import android.app.Application
import android.content.ComponentCallbacks2
import android.content.Context
import android.content.res.Configuration
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.load
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.react.flipper.ReactNativeFlipper
import com.facebook.soloader.SoLoader
import com.tencent.mmkv.MMKV
import com.vega.shared.repositories.CacheManager
import com.vega.shared.repositories.MediaRepository
import com.vega.shared.repositories.MmkvCacheManager
import com.vega.shared.repositories.ContentRepository
import com.vega.shared.repositories.MockContentRepository
import com.vega.tv.data.TvCacheManager
import com.vega.tv.data.TvNetworkClient
import com.vega.tv.data.TvRepository
import com.vega.tv.data.TvRepositoryImpl
import com.vega.tv.utils.TvPreferences
import com.vega.tv.performance.TvPerformanceManager
import androidx.lifecycle.ProcessLifecycleOwner
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch

/**
 * Main application class for the TV app
 */
class MainApplication : Application(), ReactApplication, ComponentCallbacks2 {
    
    // React Native host
    private val reactNativeHost: ReactNativeHost = object : DefaultReactNativeHost(this) {
        override fun getPackages(): List<ReactPackage> {
            return PackageList(this).packages
        }

        override fun getJSMainModuleName(): String = "index"

        override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

        override fun isNewArchEnabled(): Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED

        override fun isHermesEnabled(): Boolean = BuildConfig.IS_HERMES_ENABLED
    }

    override val reactNativeHost: ReactNativeHost
        get() = reactNativeHost

    override val reactHost: ReactHost
        get() = getDefaultReactHost(this.applicationContext, reactNativeHost)

    // Shared repositories
    lateinit var mediaRepository: MediaRepository
    lateinit var cacheManager: CacheManager
    lateinit var contentRepository: ContentRepository
    
    // TV-specific repositories and utilities
    lateinit var tvRepository: TvRepository
    lateinit var tvCacheManager: TvCacheManager
    lateinit var tvNetworkClient: TvNetworkClient
    lateinit var preferences: TvPreferences
    
    private lateinit var performanceManager: TvPerformanceManager
    
    companion object {
        private const val TAG = "MainApplication"
        
        /**
         * Get the MainApplication instance
         */
        fun from(context: Context): MainApplication {
            return context.applicationContext as MainApplication
        }
    }
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize SoLoader
        SoLoader.init(this, false)
        
        // Initialize MMKV for efficient key-value storage
        val rootDir = MMKV.initialize(this)
        Log.d(TAG, "MMKV initialized at: $rootDir")
        
        // Initialize cache manager
        val mmkv = MMKV.defaultMMKV()
        val sharedCacheManager = CacheManager(this, mmkv)
        cacheManager = TvCacheManager(this, sharedCacheManager, mmkv)
        
        // Initialize performance manager
        performanceManager = TvPerformanceManager.getInstance(this)
        performanceManager.initialize(cacheManager)
        
        // Register for memory trim events
        registerComponentCallbacks(this)
        
        // Perform startup optimizations
        performStartupOptimizations()
        
        // Initialize shared repositories
        mediaRepository = MediaRepository(
            baseUrl = "https://api.vega.example.com/", // Replace with your actual API URL
            cacheManager = cacheManager
        )
        
        // Initialize content repository
        contentRepository = MockContentRepository()
        
        // Initialize TV-specific repositories and utilities
        tvNetworkClient = TvNetworkClient(this)
        tvRepository = TvRepositoryImpl(
            context = this,
            contentRepository = contentRepository,
            mediaRepository = mediaRepository,
            tvCacheManager = tvCacheManager,
            tvNetworkClient = tvNetworkClient
        )
        
        // Initialize preferences
        preferences = TvPreferences(this)
        
        // Initialize React Native
        if (BuildConfig.IS_NEW_ARCHITECTURE_ENABLED) {
            load()
        }
        
        // Initialize Flipper in dev mode
        if (BuildConfig.DEBUG) {
            ReactNativeFlipper.initializeFlipper(this, reactNativeHost.reactInstanceManager)
        }
    }
    
    /**
     * Get the TV cache manager
     * @return The TV cache manager
     */
    fun getCacheManager(): TvCacheManager {
        return cacheManager
    }
    
    /**
     * Get the performance manager
     * @return The performance manager
     */
    fun getPerformanceManager(): TvPerformanceManager {
        return performanceManager
    }
    
    /**
     * Perform startup optimizations
     */
    private fun performStartupOptimizations() {
        // Log if this is a low memory device
        val isLowMemoryDevice = performanceManager.isLowMemoryDevice()
        Log.d(TAG, "Low memory device: $isLowMemoryDevice")
        
        // Prefetch essential data in the background
        performanceManager.launchTask(
            ProcessLifecycleOwner.get(),
            TvBackgroundOptimizer.TaskPriority.NORMAL
        ) {
            // Prefetch any essential data here
        }
    }
    
    /**
     * Handle configuration changes
     * @param newConfig The new configuration
     */
    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        // Forward to performance manager
        // No need to do anything else as the performance manager is already registered
    }
    
    /**
     * Handle low memory situations
     */
    override fun onLowMemory() {
        super.onLowMemory()
        Log.w(TAG, "onLowMemory called")
        // Forward to performance manager
        // No need to do anything else as the performance manager is already registered
    }
    
    /**
     * Handle memory trim requests from the system
     * @param level The memory trim level
     */
    override fun onTrimMemory(level: Int) {
        super.onTrimMemory(level)
        Log.d(TAG, "onTrimMemory called with level: $level")
        // Forward to performance manager
        // No need to do anything else as the performance manager is already registered
    }
} 
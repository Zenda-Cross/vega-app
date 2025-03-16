package com.vega.tv.performance

import android.app.Application
import android.content.ComponentCallbacks2
import android.content.Context
import android.content.res.Configuration
import android.util.Log
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import androidx.leanback.widget.BaseCardView
import androidx.leanback.widget.HorizontalGridView
import androidx.leanback.widget.VerticalGridView
import androidx.recyclerview.widget.RecyclerView
import com.vega.tv.data.TvCacheManager
import com.vega.tv.network.TvNetworkOptimizer
import com.vega.tv.utils.TvBackgroundOptimizer
import com.vega.tv.utils.TvMemoryManager
import com.vega.tv.utils.TvRenderingOptimizer

/**
 * Performance manager for Android TV applications.
 * Integrates all performance optimizations into a single manager class.
 */
class TvPerformanceManager private constructor(
    private val application: Application
) : ComponentCallbacks2 {

    // Tag for logging
    private val TAG = "TvPerformanceManager"
    
    // Performance components
    private lateinit var cacheManager: TvCacheManager
    private lateinit var memoryManager: TvMemoryManager
    private lateinit var renderingOptimizer: TvRenderingOptimizer
    private lateinit var networkOptimizer: TvNetworkOptimizer
    private lateinit var backgroundOptimizer: TvBackgroundOptimizer
    
    // Performance monitoring
    private var isInitialized = false
    private var isLowMemoryDevice = false
    
    /**
     * Initialize the performance manager
     * @param cacheManager The cache manager instance
     */
    fun initialize(cacheManager: TvCacheManager) {
        if (isInitialized) {
            Log.w(TAG, "TvPerformanceManager already initialized")
            return
        }
        
        this.cacheManager = cacheManager
        
        // Check if this is a low memory device
        val activityManager = application.getSystemService(Context.ACTIVITY_SERVICE) as android.app.ActivityManager
        isLowMemoryDevice = activityManager.memoryClass <= 128 // Consider devices with <= 128MB as low memory
        
        Log.d(TAG, "Initializing TvPerformanceManager, low memory device: $isLowMemoryDevice")
        
        // Initialize components
        memoryManager = TvMemoryManager(application, cacheManager)
        renderingOptimizer = TvRenderingOptimizer(application, memoryManager)
        networkOptimizer = TvNetworkOptimizer(application, cacheManager)
        backgroundOptimizer = TvBackgroundOptimizer(application)
        
        // Register callbacks
        application.registerComponentCallbacks(this)
        
        isInitialized = true
        
        // Log initial memory stats
        Log.d(TAG, "Initial memory stats: ${memoryManager.getMemoryStats()}")
    }
    
    /**
     * Get the cache manager
     * @return The cache manager
     */
    fun getCacheManager(): TvCacheManager {
        checkInitialized()
        return cacheManager
    }
    
    /**
     * Get the memory manager
     * @return The memory manager
     */
    fun getMemoryManager(): TvMemoryManager {
        checkInitialized()
        return memoryManager
    }
    
    /**
     * Get the rendering optimizer
     * @return The rendering optimizer
     */
    fun getRenderingOptimizer(): TvRenderingOptimizer {
        checkInitialized()
        return renderingOptimizer
    }
    
    /**
     * Get the network optimizer
     * @return The network optimizer
     */
    fun getNetworkOptimizer(): TvNetworkOptimizer {
        checkInitialized()
        return networkOptimizer
    }
    
    /**
     * Get the background optimizer
     * @return The background optimizer
     */
    fun getBackgroundOptimizer(): TvBackgroundOptimizer {
        checkInitialized()
        return backgroundOptimizer
    }
    
    /**
     * Check if the device is a low memory device
     * @return true if the device is a low memory device, false otherwise
     */
    fun isLowMemoryDevice(): Boolean {
        return isLowMemoryDevice
    }
    
    /**
     * Optimize a RecyclerView for TV
     * @param recyclerView The RecyclerView to optimize
     */
    fun optimizeRecyclerView(recyclerView: RecyclerView) {
        checkInitialized()
        renderingOptimizer.optimizeRecyclerView(recyclerView)
    }
    
    /**
     * Optimize a HorizontalGridView for TV
     * @param gridView The HorizontalGridView to optimize
     */
    fun optimizeHorizontalGridView(gridView: HorizontalGridView) {
        checkInitialized()
        renderingOptimizer.optimizeHorizontalGridView(gridView)
    }
    
    /**
     * Optimize a VerticalGridView for TV
     * @param gridView The VerticalGridView to optimize
     */
    fun optimizeVerticalGridView(gridView: VerticalGridView) {
        checkInitialized()
        renderingOptimizer.optimizeVerticalGridView(gridView)
    }
    
    /**
     * Optimize a BaseCardView for TV
     * @param cardView The BaseCardView to optimize
     */
    fun optimizeCardView(cardView: BaseCardView) {
        checkInitialized()
        renderingOptimizer.optimizeCardView(cardView)
    }
    
    /**
     * Launch a background task with lifecycle awareness
     * @param lifecycleOwner The lifecycle owner
     * @param priority The task priority
     * @param block The task block
     * @return The job
     */
    fun launchTask(
        lifecycleOwner: LifecycleOwner,
        priority: TvBackgroundOptimizer.TaskPriority = TvBackgroundOptimizer.TaskPriority.NORMAL,
        block: suspend kotlinx.coroutines.CoroutineScope.() -> Unit
    ): kotlinx.coroutines.Job {
        checkInitialized()
        return backgroundOptimizer.launchWithLifecycle(lifecycleOwner, priority, block)
    }
    
    /**
     * Prefetch images for TV display
     * @param imageUrls List of image URLs to prefetch
     * @param lowResolution Whether to load lower resolution images for memory optimization
     */
    suspend fun prefetchImages(imageUrls: List<String>, lowResolution: Boolean = isLowMemoryDevice) {
        checkInitialized()
        cacheManager.prefetchImages(imageUrls, lowResolution)
    }
    
    /**
     * Clear all caches
     * @param preserveWatchProgress Whether to preserve watch progress data
     */
    fun clearAllCaches(preserveWatchProgress: Boolean = true) {
        checkInitialized()
        cacheManager.clearCache(preserveWatchProgress)
        
        backgroundOptimizer.launchWithLifecycle(
            ProcessLifecycleOwner.get(),
            TvBackgroundOptimizer.TaskPriority.LOW
        ) {
            networkOptimizer.clearNetworkCache()
        }
    }
    
    /**
     * Check if the manager is initialized
     * @throws IllegalStateException if not initialized
     */
    private fun checkInitialized() {
        if (!isInitialized) {
            throw IllegalStateException("TvPerformanceManager not initialized")
        }
    }
    
    /**
     * Handle configuration changes
     * @param newConfig The new configuration
     */
    override fun onConfigurationChanged(newConfig: Configuration) {
        // Nothing to do here
    }
    
    /**
     * Handle low memory situations
     */
    override fun onLowMemory() {
        if (!isInitialized) return
        
        Log.w(TAG, "onLowMemory called")
        
        // Forward to components
        memoryManager.onLowMemory()
        
        // Clear non-essential caches
        cacheManager.trimMemory(ComponentCallbacks2.TRIM_MEMORY_COMPLETE)
    }
    
    /**
     * Handle memory trim requests from the system
     * @param level The memory trim level
     */
    override fun onTrimMemory(level: Int) {
        if (!isInitialized) return
        
        Log.d(TAG, "onTrimMemory called with level: $level")
        
        // Forward to components
        memoryManager.onTrimMemory(level)
        renderingOptimizer.trimMemory(level)
        
        // Handle based on trim level
        when (level) {
            ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL,
            ComponentCallbacks2.TRIM_MEMORY_COMPLETE -> {
                // Critical memory situation - clear all possible caches
                cacheManager.trimMemory(level)
                System.gc()
            }
            
            ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW,
            ComponentCallbacks2.TRIM_MEMORY_MODERATE -> {
                // Moderate memory pressure - trim caches
                cacheManager.trimMemory(level)
            }
        }
    }
    
    /**
     * Release all resources
     */
    fun release() {
        if (!isInitialized) return
        
        // Unregister callbacks
        application.unregisterComponentCallbacks(this)
        
        // Shutdown background executor
        backgroundOptimizer.shutdown()
        
        isInitialized = false
    }
    
    companion object {
        @Volatile
        private var INSTANCE: TvPerformanceManager? = null
        
        /**
         * Get the singleton instance
         * @param application The application context
         * @return The TvPerformanceManager instance
         */
        fun getInstance(application: Application): TvPerformanceManager {
            return INSTANCE ?: synchronized(this) {
                INSTANCE ?: TvPerformanceManager(application).also { INSTANCE = it }
            }
        }
    }
} 
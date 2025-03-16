package com.vega.tv.utils

import android.app.ActivityManager
import android.content.ComponentCallbacks2
import android.content.Context
import android.os.Build
import android.os.Debug
import android.util.Log
import com.bumptech.glide.Glide
import com.vega.tv.data.TvCacheManager
import java.lang.ref.WeakReference

/**
 * Memory manager for Android TV applications.
 * Handles memory optimization, monitoring, and cleanup to ensure smooth performance.
 */
class TvMemoryManager(
    private val context: Context,
    private val cacheManager: TvCacheManager
) : ComponentCallbacks2 {

    private val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    private val memoryClass = activityManager.memoryClass
    private val largeMemoryClass = activityManager.largeMemoryClass
    
    // Track active fragments to manage their lifecycle
    private val activeFragments = mutableListOf<WeakReference<Any>>()
    
    // Memory thresholds
    private val criticalMemoryThreshold = memoryClass * 0.15 // 15% of available memory
    private val warningMemoryThreshold = memoryClass * 0.30 // 30% of available memory
    
    // Logging tag
    private val TAG = "TvMemoryManager"
    
    init {
        Log.d(TAG, "Memory Class: $memoryClass MB, Large Memory Class: $largeMemoryClass MB")
    }
    
    /**
     * Register a fragment or component for memory management
     * @param component The component to register
     */
    fun registerComponent(component: Any) {
        // Clean up any null references first
        cleanupReferences()
        
        // Add the new component
        activeFragments.add(WeakReference(component))
        
        // Check memory status after registration
        checkMemoryStatus()
    }
    
    /**
     * Unregister a component from memory management
     * @param component The component to unregister
     */
    fun unregisterComponent(component: Any) {
        activeFragments.removeAll { it.get() == component || it.get() == null }
    }
    
    /**
     * Clean up null references in the active fragments list
     */
    private fun cleanupReferences() {
        activeFragments.removeAll { it.get() == null }
    }
    
    /**
     * Get the current available memory in MB
     * @return Available memory in MB
     */
    fun getAvailableMemory(): Int {
        val memoryInfo = ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memoryInfo)
        return (memoryInfo.availMem / (1024 * 1024)).toInt()
    }
    
    /**
     * Get the current used memory in MB
     * @return Used memory in MB
     */
    fun getUsedMemory(): Int {
        val runtime = Runtime.getRuntime()
        val usedMemory = (runtime.totalMemory() - runtime.freeMemory()) / (1024 * 1024)
        return usedMemory.toInt()
    }
    
    /**
     * Check if the app is under memory pressure
     * @return true if under memory pressure, false otherwise
     */
    fun isUnderMemoryPressure(): Boolean {
        val availableMemory = getAvailableMemory()
        return availableMemory < criticalMemoryThreshold
    }
    
    /**
     * Check the current memory status and take appropriate actions
     */
    fun checkMemoryStatus() {
        val availableMemory = getAvailableMemory()
        val usedMemory = getUsedMemory()
        
        Log.d(TAG, "Memory Status - Available: $availableMemory MB, Used: $usedMemory MB")
        
        when {
            availableMemory < criticalMemoryThreshold -> {
                Log.w(TAG, "Critical memory pressure detected!")
                performCriticalMemoryCleanup()
            }
            availableMemory < warningMemoryThreshold -> {
                Log.w(TAG, "Memory pressure warning!")
                performMemoryCleanup()
            }
        }
    }
    
    /**
     * Perform critical memory cleanup when under severe memory pressure
     */
    private fun performCriticalMemoryCleanup() {
        // Clear all image caches
        Glide.get(context).clearMemory()
        cacheManager.trimMemory(ComponentCallbacks2.TRIM_MEMORY_COMPLETE)
        
        // Force garbage collection
        System.gc()
        
        // Log memory after cleanup
        Log.d(TAG, "After critical cleanup - Available: ${getAvailableMemory()} MB, Used: ${getUsedMemory()} MB")
    }
    
    /**
     * Perform regular memory cleanup when under moderate memory pressure
     */
    private fun performMemoryCleanup() {
        // Trim image caches
        cacheManager.trimMemory(ComponentCallbacks2.TRIM_MEMORY_MODERATE)
        
        // Log memory after cleanup
        Log.d(TAG, "After cleanup - Available: ${getAvailableMemory()} MB, Used: ${getUsedMemory()} MB")
    }
    
    /**
     * Get memory usage statistics for debugging
     * @return String containing memory usage statistics
     */
    fun getMemoryStats(): String {
        val runtime = Runtime.getRuntime()
        val maxMemory = runtime.maxMemory() / (1024 * 1024)
        val totalMemory = runtime.totalMemory() / (1024 * 1024)
        val freeMemory = runtime.freeMemory() / (1024 * 1024)
        val usedMemory = totalMemory - freeMemory
        
        val memoryInfo = ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memoryInfo)
        val availableMemory = memoryInfo.availMem / (1024 * 1024)
        val totalDeviceMemory = memoryInfo.totalMem / (1024 * 1024)
        
        val nativeHeapSize = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Debug.getNativeHeapSize() / (1024 * 1024)
        } else {
            0
        }
        
        val nativeHeapAllocated = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            Debug.getNativeHeapAllocatedSize() / (1024 * 1024)
        } else {
            0
        }
        
        return """
            Memory Stats:
            - Max Memory: $maxMemory MB
            - Total Memory: $totalMemory MB
            - Free Memory: $freeMemory MB
            - Used Memory: $usedMemory MB
            - Available Device Memory: $availableMemory MB
            - Total Device Memory: $totalDeviceMemory MB
            - Native Heap Size: $nativeHeapSize MB
            - Native Heap Allocated: $nativeHeapAllocated MB
            - Memory Class: $memoryClass MB
            - Large Memory Class: $largeMemoryClass MB
        """.trimIndent()
    }
    
    /**
     * Optimize memory before loading heavy content
     * @param requiredMemoryMB Estimated memory required in MB
     * @return true if optimization was successful, false otherwise
     */
    fun optimizeBeforeHeavyOperation(requiredMemoryMB: Int): Boolean {
        val availableMemory = getAvailableMemory()
        
        if (availableMemory < requiredMemoryMB) {
            Log.w(TAG, "Not enough memory for operation requiring $requiredMemoryMB MB. Available: $availableMemory MB")
            performCriticalMemoryCleanup()
            
            // Check if we have enough memory after cleanup
            return getAvailableMemory() >= requiredMemoryMB
        }
        
        return true
    }
    
    /**
     * Handle memory trim requests from the system
     * @param level The memory trim level
     */
    override fun onTrimMemory(level: Int) {
        Log.d(TAG, "onTrimMemory called with level: $level")
        
        when (level) {
            ComponentCallbacks2.TRIM_MEMORY_COMPLETE,
            ComponentCallbacks2.TRIM_MEMORY_MODERATE,
            ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL -> {
                performCriticalMemoryCleanup()
            }
            ComponentCallbacks2.TRIM_MEMORY_BACKGROUND,
            ComponentCallbacks2.TRIM_MEMORY_UI_HIDDEN,
            ComponentCallbacks2.TRIM_MEMORY_RUNNING_MODERATE -> {
                performMemoryCleanup()
            }
        }
        
        // Forward to cache manager
        cacheManager.trimMemory(level)
    }
    
    /**
     * Handle configuration changes
     */
    override fun onConfigurationChanged(newConfig: android.content.res.Configuration) {
        // Not used in this implementation
    }
    
    /**
     * Handle low memory situations
     */
    override fun onLowMemory() {
        Log.w(TAG, "onLowMemory called")
        performCriticalMemoryCleanup()
    }
    
    companion object {
        /**
         * Calculate optimal memory cache size based on device memory
         * @param context The application context
         * @param percentage The percentage of memory to use (default: 0.125 or 1/8)
         * @return The optimal cache size in bytes
         */
        fun calculateOptimalCacheSize(context: Context, percentage: Double = 0.125): Int {
            val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
            val memoryClass = activityManager.memoryClass
            
            // Convert MB to KB and apply percentage
            return (memoryClass * 1024 * percentage).toInt()
        }
    }
} 
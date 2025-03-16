package com.vega.tv.data

import android.content.Context
import android.graphics.Bitmap
import android.util.LruCache
import com.bumptech.glide.Glide
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.request.RequestOptions
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import com.tencent.mmkv.MMKV
import com.vega.shared.models.MediaContent
import com.vega.shared.repositories.CacheManager
import com.vega.tv.models.TvMediaContent
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.util.concurrent.TimeUnit
import android.os.Build
import android.app.ActivityManager
import androidx.core.content.ContextCompat

/**
 * TV-specific cache manager that extends the shared cache manager with TV-specific optimizations.
 * Provides caching for TV-optimized data models and images.
 */
class TvCacheManager(
    private val context: Context,
    private val sharedCacheManager: CacheManager,
    private val mmkv: MMKV
) {
    private val gson = Gson()
    private val cacheDir = File(context.cacheDir, "tv_cache")
    
    // Calculate optimal memory cache size based on available memory
    private val maxMemory = (Runtime.getRuntime().maxMemory() / 1024).toInt()
    // Use 1/8th of the available memory for this memory cache
    private val cacheSize = maxMemory / 8
    
    // Create optimized LruCache with memory-efficient configuration
    private val imageCache = object : LruCache<String, Bitmap>(cacheSize) {
        override fun sizeOf(key: String, bitmap: Bitmap): Int {
            // The cache size will be measured in kilobytes rather than number of items
            return bitmap.byteCount / 1024
        }
        
        override fun entryRemoved(evicted: Boolean, key: String, oldValue: Bitmap, newValue: Bitmap?) {
            // Properly handle bitmap recycling when removed from cache
            if (evicted && !oldValue.isRecycled && Build.VERSION.SDK_INT < Build.VERSION_CODES.P) {
                oldValue.recycle()
            }
        }
    }
    
    // Glide request options for TV optimization
    private val tvGlideOptions = RequestOptions()
        .diskCacheStrategy(DiskCacheStrategy.ALL)
        .skipMemoryCache(false)
        .dontAnimate() // Animations handled by Leanback
    
    init {
        // Create cache directory if it doesn't exist
        if (!cacheDir.exists()) {
            cacheDir.mkdirs()
        }
        
        // Initialize MMKV with optimized settings
        MMKV.initialize(context)
    }
    
    /**
     * Get cached TV-optimized featured content
     * @return List of TV-optimized media content or null if not in cache
     */
    fun getFeaturedContent(): List<TvMediaContent>? {
        val json = mmkv.getString(KEY_FEATURED_CONTENT, null) ?: return null
        val type = object : TypeToken<List<TvMediaContent>>() {}.type
        return gson.fromJson(json, type)
    }
    
    /**
     * Save TV-optimized featured content to cache
     * @param content The content to cache
     */
    fun saveFeaturedContent(content: List<TvMediaContent>) {
        val json = gson.toJson(content)
        mmkv.putString(KEY_FEATURED_CONTENT, json)
        updateTimestamp(KEY_FEATURED_CONTENT)
    }
    
    /**
     * Get cached TV-optimized trending content
     * @return List of TV-optimized media content or null if not in cache
     */
    fun getTrendingContent(): List<TvMediaContent>? {
        val json = mmkv.getString(KEY_TRENDING_CONTENT, null) ?: return null
        val type = object : TypeToken<List<TvMediaContent>>() {}.type
        return gson.fromJson(json, type)
    }
    
    /**
     * Save TV-optimized trending content to cache
     * @param content The content to cache
     */
    fun saveTrendingContent(content: List<TvMediaContent>) {
        val json = gson.toJson(content)
        mmkv.putString(KEY_TRENDING_CONTENT, json)
        updateTimestamp(KEY_TRENDING_CONTENT)
    }
    
    /**
     * Get cached TV-optimized content by category
     * @param category The category name
     * @return List of TV-optimized media content or null if not in cache
     */
    fun getContentByCategory(category: String): List<TvMediaContent>? {
        val key = "$KEY_CATEGORY_PREFIX$category"
        val json = mmkv.getString(key, null) ?: return null
        val type = object : TypeToken<List<TvMediaContent>>() {}.type
        return gson.fromJson(json, type)
    }
    
    /**
     * Save TV-optimized content by category to cache
     * @param category The category name
     * @param content The content to cache
     */
    fun saveContentByCategory(category: String, content: List<TvMediaContent>) {
        val key = "$KEY_CATEGORY_PREFIX$category"
        val json = gson.toJson(content)
        mmkv.putString(key, json)
        updateTimestamp(key)
    }
    
    /**
     * Get cached TV-optimized content by ID
     * @param id The content ID
     * @return TV-optimized media content or null if not in cache
     */
    fun getContentById(id: String): TvMediaContent? {
        val key = "$KEY_CONTENT_PREFIX$id"
        val json = mmkv.getString(key, null) ?: return null
        return gson.fromJson(json, TvMediaContent::class.java)
    }
    
    /**
     * Save TV-optimized content by ID to cache
     * @param id The content ID
     * @param content The content to cache
     */
    fun saveContentById(id: String, content: TvMediaContent) {
        val key = "$KEY_CONTENT_PREFIX$id"
        val json = gson.toJson(content)
        mmkv.putString(key, json)
        updateTimestamp(key)
    }
    
    /**
     * Get cached watch progress for content
     * @return Map of content ID to watch progress in seconds
     */
    fun getWatchProgressMap(): Map<String, Int> {
        val json = mmkv.getString(KEY_WATCH_PROGRESS, null) ?: return emptyMap()
        val type = object : TypeToken<Map<String, Int>>() {}.type
        return gson.fromJson(json, type)
    }
    
    /**
     * Save watch progress for content
     * @param contentId The content ID
     * @param progressSeconds The watch progress in seconds
     */
    fun saveWatchProgress(contentId: String, progressSeconds: Int) {
        val progressMap = getWatchProgressMap().toMutableMap()
        progressMap[contentId] = progressSeconds
        val json = gson.toJson(progressMap)
        mmkv.putString(KEY_WATCH_PROGRESS, json)
        updateTimestamp(KEY_WATCH_PROGRESS)
    }
    
    /**
     * Optimized method to prefetch and cache images for TV display
     * @param imageUrls List of image URLs to prefetch
     * @param lowResolution Whether to load lower resolution images for memory optimization
     */
    suspend fun prefetchImages(imageUrls: List<String>, lowResolution: Boolean = false) = withContext(Dispatchers.IO) {
        // Filter out already cached images
        val urlsToFetch = imageUrls.filter { url -> 
            imageCache.get(url) == null && !Glide.with(context).isImageInCache(url)
        }
        
        // Batch process in smaller chunks to avoid memory pressure
        urlsToFetch.chunked(5).forEach { batch ->
            batch.forEach { url ->
                try {
                    // Apply TV-optimized options
                    var requestOptions = tvGlideOptions
                    
                    // Apply lower resolution for memory optimization if needed
                    if (lowResolution) {
                        requestOptions = requestOptions.override(480, 270) // 16:9 SD resolution
                    }
                    
                    // Load image with Glide and cache it
                    val bitmap = Glide.with(context)
                        .asBitmap()
                        .load(url)
                        .apply(requestOptions)
                        .submit()
                        .get()
                    
                    // Store in memory cache
                    imageCache.put(url, bitmap)
                } catch (e: Exception) {
                    // Ignore errors during prefetching
                }
            }
        }
    }
    
    /**
     * Get a cached bitmap from memory cache
     * @param url The image URL
     * @return The cached bitmap or null if not in cache
     */
    fun getCachedBitmap(url: String): Bitmap? {
        return imageCache.get(url)
    }
    
    /**
     * Check if the cache for a specific key is expired
     * @param key The cache key
     * @param maxAgeHours The maximum age in hours
     * @return True if the cache is expired, false otherwise
     */
    fun isCacheExpired(key: String, maxAgeHours: Int): Boolean {
        val timestamp = mmkv.getLong("${key}_timestamp", 0)
        if (timestamp == 0L) return true
        
        val currentTime = System.currentTimeMillis()
        val maxAgeMillis = TimeUnit.HOURS.toMillis(maxAgeHours.toLong())
        
        return currentTime - timestamp > maxAgeMillis
    }
    
    /**
     * Update the timestamp for a cache key
     * @param key The cache key
     */
    fun updateTimestamp(key: String) {
        mmkv.putLong("${key}_timestamp", System.currentTimeMillis())
    }
    
    /**
     * Trim memory when system is under memory pressure
     * @param level The memory trim level
     */
    fun trimMemory(level: Int) {
        // Trim based on memory pressure level
        when (level) {
            // Critical memory situations
            ActivityManager.TRIM_MEMORY_COMPLETE,
            ActivityManager.TRIM_MEMORY_MODERATE -> {
                imageCache.evictAll()
                System.gc()
            }
            // Less critical memory situations
            ActivityManager.TRIM_MEMORY_BACKGROUND,
            ActivityManager.TRIM_MEMORY_UI_HIDDEN -> {
                // Trim cache to half size
                val cacheEntries = imageCache.snapshot().keys.toList()
                val trimCount = cacheEntries.size / 2
                cacheEntries.take(trimCount).forEach { key ->
                    imageCache.remove(key)
                }
            }
        }
        
        // Let Glide handle its own memory management
        Glide.get(context).trimMemory(level)
    }
    
    /**
     * Clear all cached data
     * @param preserveWatchProgress Whether to preserve watch progress data
     */
    fun clearCache(preserveWatchProgress: Boolean = true) {
        // Clear MMKV cache
        val keysToKeep = if (preserveWatchProgress) {
            setOf("${KEY_WATCH_PROGRESS}_timestamp", KEY_WATCH_PROGRESS)
        } else {
            emptySet()
        }
        
        val allKeys = mmkv.allKeys()
        
        if (allKeys != null) {
            for (key in allKeys) {
                if (key !in keysToKeep) {
                    mmkv.removeValueForKey(key)
                }
            }
        }
        
        // Clear image cache
        imageCache.evictAll()
        
        // Clear disk cache
        Glide.get(context).clearDiskCache()
    }
    
    /**
     * Extension function to check if an image is in Glide's cache
     */
    private fun com.bumptech.glide.RequestManager.isImageInCache(url: String): Boolean {
        return Glide.with(context).getRequest(url)?.isComplete ?: false
    }
    
    companion object {
        private const val KEY_FEATURED_CONTENT = "tv_featured_content"
        private const val KEY_TRENDING_CONTENT = "tv_trending_content"
        private const val KEY_CATEGORY_PREFIX = "tv_category_"
        private const val KEY_CONTENT_PREFIX = "tv_content_"
        private const val KEY_WATCH_PROGRESS = "tv_watch_progress"
    }
} 
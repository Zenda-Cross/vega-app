package com.vega.shared.repositories

import com.vega.shared.models.MediaCategory
import com.vega.shared.models.MediaInfo

/**
 * Interface for managing cache of media data
 */
interface CacheManager {
    /**
     * Get cached home page data
     * @param provider The content provider
     * @return List of media categories or null if not in cache
     */
    fun getHomePageData(provider: String): List<MediaCategory>?
    
    /**
     * Save home page data to cache
     * @param provider The content provider
     * @param data The data to cache
     */
    fun saveHomePageData(provider: String, data: List<MediaCategory>)
    
    /**
     * Get cached media info
     * @param link The link to the media item
     * @return Media info or null if not in cache
     */
    fun getMediaInfo(link: String): MediaInfo?
    
    /**
     * Save media info to cache
     * @param link The link to the media item
     * @param info The info to cache
     */
    fun saveMediaInfo(link: String, info: MediaInfo)
    
    /**
     * Clear all cached data
     */
    fun clearCache()
} 
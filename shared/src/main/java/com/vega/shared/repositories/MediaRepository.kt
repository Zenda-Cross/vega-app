package com.vega.shared.repositories

import com.vega.shared.api.MediaService
import com.vega.shared.models.MediaCategory
import com.vega.shared.models.MediaInfo
import com.vega.shared.models.Stream
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

/**
 * Repository for accessing media data
 */
class MediaRepository(
    private val baseUrl: String,
    private val cacheManager: CacheManager
) {
    private val retrofit = Retrofit.Builder()
        .baseUrl(baseUrl)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
    
    private val mediaService = retrofit.create(MediaService::class.java)
    
    /**
     * Get home page data including featured content and categories
     * @param provider The content provider to use
     * @return List of media categories
     */
    suspend fun getHomePageData(provider: String): List<MediaCategory> = withContext(Dispatchers.IO) {
        // Check cache first
        val cachedData = cacheManager.getHomePageData(provider)
        if (cachedData != null) {
            return@withContext cachedData
        }
        
        // Fetch from network
        try {
            val result = mediaService.getHomePageData(provider)
            // Cache the result
            cacheManager.saveHomePageData(provider, result)
            result
        } catch (e: Exception) {
            // Return empty list on error
            emptyList()
        }
    }
    
    /**
     * Get detailed information about a media item
     * @param link The link to the media item
     * @param provider The content provider to use
     * @return Detailed media information or null on error
     */
    suspend fun getMediaInfo(link: String, provider: String): MediaInfo? = withContext(Dispatchers.IO) {
        // Check cache first
        val cachedData = cacheManager.getMediaInfo(link)
        if (cachedData != null) {
            return@withContext cachedData
        }
        
        // Fetch from network
        try {
            val result = mediaService.getMediaInfo(link, provider)
            // Cache the result
            cacheManager.saveMediaInfo(link, result)
            result
        } catch (e: Exception) {
            null
        }
    }
    
    /**
     * Search for media items
     * @param query The search query
     * @param provider The content provider to use
     * @return List of media categories containing search results
     */
    suspend fun searchMedia(query: String, provider: String): List<MediaCategory> = withContext(Dispatchers.IO) {
        try {
            mediaService.searchMedia(query, provider)
        } catch (e: Exception) {
            emptyList()
        }
    }
    
    /**
     * Get stream links for a media item
     * @param link The link to the media item
     * @param provider The content provider to use
     * @return List of available streams
     */
    suspend fun getStreams(link: String, provider: String): List<Stream> = withContext(Dispatchers.IO) {
        try {
            mediaService.getStreams(link, provider)
        } catch (e: Exception) {
            emptyList()
        }
    }
} 
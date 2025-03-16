package com.vega.shared.api

import com.vega.shared.models.MediaCategory
import com.vega.shared.models.MediaInfo
import com.vega.shared.models.Stream
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

/**
 * Interface for media API services
 */
interface MediaService {
    /**
     * Get home page data including featured content and categories
     * @param provider The content provider to use
     * @return List of media categories
     */
    @GET("homepage")
    suspend fun getHomePageData(@Query("provider") provider: String): List<MediaCategory>
    
    /**
     * Get detailed information about a media item
     * @param link The link to the media item
     * @param provider The content provider to use
     * @return Detailed media information
     */
    @GET("info")
    suspend fun getMediaInfo(
        @Query("link") link: String,
        @Query("provider") provider: String
    ): MediaInfo
    
    /**
     * Search for media items
     * @param query The search query
     * @param provider The content provider to use
     * @return List of media categories containing search results
     */
    @GET("search")
    suspend fun searchMedia(
        @Query("query") query: String,
        @Query("provider") provider: String
    ): List<MediaCategory>
    
    /**
     * Get stream links for a media item
     * @param link The link to the media item
     * @param provider The content provider to use
     * @return List of available streams
     */
    @GET("stream")
    suspend fun getStreams(
        @Query("link") link: String,
        @Query("provider") provider: String
    ): List<Stream>
} 
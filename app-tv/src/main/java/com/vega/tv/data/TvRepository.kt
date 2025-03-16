package com.vega.tv.data

import com.vega.shared.models.MediaContent
import com.vega.tv.models.TvMediaContent
import kotlinx.coroutines.flow.Flow

/**
 * Repository interface for TV-specific data operations.
 * This serves as the main entry point for all data access in the TV app.
 */
interface TvRepository {
    /**
     * Get featured content optimized for TV display
     * @return Flow of TV-optimized media content list
     */
    fun getFeaturedContent(): Flow<List<TvMediaContent>>
    
    /**
     * Get trending content optimized for TV display
     * @return Flow of TV-optimized media content list
     */
    fun getTrendingContent(): Flow<List<TvMediaContent>>
    
    /**
     * Get recommended content for the user optimized for TV display
     * @return Flow of TV-optimized media content list
     */
    fun getRecommendedContent(): Flow<List<TvMediaContent>>
    
    /**
     * Get content that the user has started watching but not finished
     * @return Flow of TV-optimized media content list
     */
    fun getContinueWatchingContent(): Flow<List<TvMediaContent>>
    
    /**
     * Get movies optimized for TV display
     * @return Flow of TV-optimized media content list
     */
    fun getMovies(): Flow<List<TvMediaContent>>
    
    /**
     * Get TV shows optimized for TV display
     * @return Flow of TV-optimized media content list
     */
    fun getTvShows(): Flow<List<TvMediaContent>>
    
    /**
     * Get sports content optimized for TV display
     * @return Flow of TV-optimized media content list
     */
    fun getSportsContent(): Flow<List<TvMediaContent>>
    
    /**
     * Get kids content optimized for TV display
     * @return Flow of TV-optimized media content list
     */
    fun getKidsContent(): Flow<List<TvMediaContent>>
    
    /**
     * Get content by ID optimized for TV display
     * @param id The content ID
     * @return TV-optimized media content or null if not found
     */
    suspend fun getContentById(id: String): TvMediaContent?
    
    /**
     * Search for content optimized for TV display
     * @param query The search query
     * @return Flow of TV-optimized media content list
     */
    fun searchContent(query: String): Flow<List<TvMediaContent>>
    
    /**
     * Get popular content for search suggestions optimized for TV display
     * @return Flow of TV-optimized media content list
     */
    fun getPopularContent(): Flow<List<TvMediaContent>>
    
    /**
     * Prefetch content for improved TV performance
     * This method triggers background prefetching of content that might be needed soon
     * @param contentIds List of content IDs to prefetch
     */
    suspend fun prefetchContent(contentIds: List<String>)
    
    /**
     * Clear all cached data
     */
    suspend fun clearCache()
} 
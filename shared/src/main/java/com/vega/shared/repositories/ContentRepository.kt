package com.vega.shared.repositories

import com.vega.shared.models.MediaContent

/**
 * ContentRepository is responsible for fetching media content from various sources.
 */
interface ContentRepository {
    /**
     * Get featured content
     */
    suspend fun getFeaturedContent(): List<MediaContent>
    
    /**
     * Get trending content
     */
    suspend fun getTrendingContent(): List<MediaContent>
    
    /**
     * Get recommended content for the user
     */
    suspend fun getRecommendedContent(): List<MediaContent>
    
    /**
     * Get content that the user has started watching but not finished
     */
    suspend fun getContinueWatchingContent(): List<MediaContent>
    
    /**
     * Get movies
     */
    suspend fun getMovies(): List<MediaContent>
    
    /**
     * Get TV shows
     */
    suspend fun getTvShows(): List<MediaContent>
    
    /**
     * Get sports content
     */
    suspend fun getSportsContent(): List<MediaContent>
    
    /**
     * Get kids content
     */
    suspend fun getKidsContent(): List<MediaContent>
    
    /**
     * Get content by ID
     */
    suspend fun getContentById(id: String): MediaContent?
    
    /**
     * Search for content
     */
    suspend fun searchContent(query: String): List<MediaContent>
    
    /**
     * Get popular content for search suggestions
     */
    suspend fun getPopularContent(): List<MediaContent>
} 
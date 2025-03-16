package com.vega.tv.data

import android.content.Context
import android.util.Log
import com.vega.shared.models.MediaContent
import com.vega.shared.repositories.ContentRepository
import com.vega.shared.repositories.MediaRepository
import com.vega.tv.models.TvMediaContent
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext

/**
 * Implementation of the TvRepository interface.
 * Uses the shared repositories, TV-specific cache manager, and network client.
 */
class TvRepositoryImpl(
    private val context: Context,
    private val contentRepository: ContentRepository,
    private val mediaRepository: MediaRepository,
    private val tvCacheManager: TvCacheManager,
    private val tvNetworkClient: TvNetworkClient
) : TvRepository {
    
    private val TAG = "TvRepositoryImpl"
    
    // Cache expiration times (in hours)
    private val FEATURED_CACHE_HOURS = 2
    private val TRENDING_CACHE_HOURS = 2
    private val CATEGORY_CACHE_HOURS = 4
    private val CONTENT_CACHE_HOURS = 24
    
    override fun getFeaturedContent(): Flow<List<TvMediaContent>> = flow {
        // Check cache first
        val cacheKey = "featured_content"
        val cachedContent = tvCacheManager.getFeaturedContent()
        
        if (cachedContent != null && !tvCacheManager.isCacheExpired(cacheKey, FEATURED_CACHE_HOURS)) {
            // Emit cached content
            emit(cachedContent)
            
            // Prefetch images in the background
            prefetchImagesInBackground(cachedContent)
        } else {
            try {
                // Fetch from network
                val content = withContext(Dispatchers.IO) {
                    contentRepository.getFeaturedContent()
                }
                
                // Get watch progress
                val watchProgressMap = tvCacheManager.getWatchProgressMap()
                
                // Transform to TV-specific model
                val tvContent = TvDataTransformer.transformMediaContentList(content, watchProgressMap)
                
                // Cache the result
                tvCacheManager.saveFeaturedContent(tvContent)
                tvCacheManager.updateTimestamp(cacheKey)
                
                // Emit the result
                emit(tvContent)
                
                // Prefetch images in the background
                prefetchImagesInBackground(tvContent)
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching featured content", e)
                
                // Emit cached content if available, even if expired
                if (cachedContent != null) {
                    emit(cachedContent)
                } else {
                    // Emit empty list if no cached content
                    emit(emptyList())
                }
            }
        }
    }.flowOn(Dispatchers.IO)
    
    override fun getTrendingContent(): Flow<List<TvMediaContent>> = flow {
        // Check cache first
        val cacheKey = "trending_content"
        val cachedContent = tvCacheManager.getTrendingContent()
        
        if (cachedContent != null && !tvCacheManager.isCacheExpired(cacheKey, TRENDING_CACHE_HOURS)) {
            // Emit cached content
            emit(cachedContent)
            
            // Prefetch images in the background
            prefetchImagesInBackground(cachedContent)
        } else {
            try {
                // Fetch from network
                val content = withContext(Dispatchers.IO) {
                    contentRepository.getTrendingContent()
                }
                
                // Get watch progress
                val watchProgressMap = tvCacheManager.getWatchProgressMap()
                
                // Transform to TV-specific model
                val tvContent = TvDataTransformer.transformMediaContentList(content, watchProgressMap)
                
                // Cache the result
                tvCacheManager.saveTrendingContent(tvContent)
                tvCacheManager.updateTimestamp(cacheKey)
                
                // Emit the result
                emit(tvContent)
                
                // Prefetch images in the background
                prefetchImagesInBackground(tvContent)
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching trending content", e)
                
                // Emit cached content if available, even if expired
                if (cachedContent != null) {
                    emit(cachedContent)
                } else {
                    // Emit empty list if no cached content
                    emit(emptyList())
                }
            }
        }
    }.flowOn(Dispatchers.IO)
    
    override fun getRecommendedContent(): Flow<List<TvMediaContent>> = flow {
        // Check cache first
        val cacheKey = "recommended_content"
        val cachedContent = tvCacheManager.getContentByCategory("recommended")
        
        if (cachedContent != null && !tvCacheManager.isCacheExpired(cacheKey, CATEGORY_CACHE_HOURS)) {
            // Emit cached content
            emit(cachedContent)
            
            // Prefetch images in the background
            prefetchImagesInBackground(cachedContent)
        } else {
            try {
                // Fetch from network
                val content = withContext(Dispatchers.IO) {
                    contentRepository.getRecommendedContent()
                }
                
                // Get watch progress
                val watchProgressMap = tvCacheManager.getWatchProgressMap()
                
                // Transform to TV-specific model
                val tvContent = TvDataTransformer.transformMediaContentList(content, watchProgressMap)
                
                // Cache the result
                tvCacheManager.saveContentByCategory("recommended", tvContent)
                tvCacheManager.updateTimestamp(cacheKey)
                
                // Emit the result
                emit(tvContent)
                
                // Prefetch images in the background
                prefetchImagesInBackground(tvContent)
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching recommended content", e)
                
                // Emit cached content if available, even if expired
                if (cachedContent != null) {
                    emit(cachedContent)
                } else {
                    // Emit empty list if no cached content
                    emit(emptyList())
                }
            }
        }
    }.flowOn(Dispatchers.IO)
    
    override fun getContinueWatchingContent(): Flow<List<TvMediaContent>> = flow {
        // Check cache first
        val cacheKey = "continue_watching_content"
        val cachedContent = tvCacheManager.getContentByCategory("continue_watching")
        
        if (cachedContent != null && !tvCacheManager.isCacheExpired(cacheKey, CATEGORY_CACHE_HOURS)) {
            // Emit cached content
            emit(cachedContent)
            
            // Prefetch images in the background
            prefetchImagesInBackground(cachedContent)
        } else {
            try {
                // Fetch from network
                val content = withContext(Dispatchers.IO) {
                    contentRepository.getContinueWatchingContent()
                }
                
                // Get watch progress
                val watchProgressMap = tvCacheManager.getWatchProgressMap()
                
                // Transform to TV-specific model with watch progress
                val tvContent = TvDataTransformer.transformMediaContentList(content, watchProgressMap)
                
                // Cache the result
                tvCacheManager.saveContentByCategory("continue_watching", tvContent)
                tvCacheManager.updateTimestamp(cacheKey)
                
                // Emit the result
                emit(tvContent)
                
                // Prefetch images in the background
                prefetchImagesInBackground(tvContent)
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching continue watching content", e)
                
                // Emit cached content if available, even if expired
                if (cachedContent != null) {
                    emit(cachedContent)
                } else {
                    // Emit empty list if no cached content
                    emit(emptyList())
                }
            }
        }
    }.flowOn(Dispatchers.IO)
    
    override fun getMovies(): Flow<List<TvMediaContent>> = flow {
        // Check cache first
        val cacheKey = "movies_content"
        val cachedContent = tvCacheManager.getContentByCategory("movies")
        
        if (cachedContent != null && !tvCacheManager.isCacheExpired(cacheKey, CATEGORY_CACHE_HOURS)) {
            // Emit cached content
            emit(cachedContent)
            
            // Prefetch images in the background
            prefetchImagesInBackground(cachedContent)
        } else {
            try {
                // Fetch from network
                val content = withContext(Dispatchers.IO) {
                    contentRepository.getMovies()
                }
                
                // Get watch progress
                val watchProgressMap = tvCacheManager.getWatchProgressMap()
                
                // Transform to TV-specific model
                val tvContent = TvDataTransformer.transformMediaContentList(content, watchProgressMap)
                
                // Cache the result
                tvCacheManager.saveContentByCategory("movies", tvContent)
                tvCacheManager.updateTimestamp(cacheKey)
                
                // Emit the result
                emit(tvContent)
                
                // Prefetch images in the background
                prefetchImagesInBackground(tvContent)
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching movies", e)
                
                // Emit cached content if available, even if expired
                if (cachedContent != null) {
                    emit(cachedContent)
                } else {
                    // Emit empty list if no cached content
                    emit(emptyList())
                }
            }
        }
    }.flowOn(Dispatchers.IO)
    
    override fun getTvShows(): Flow<List<TvMediaContent>> = flow {
        // Check cache first
        val cacheKey = "tv_shows_content"
        val cachedContent = tvCacheManager.getContentByCategory("tv_shows")
        
        if (cachedContent != null && !tvCacheManager.isCacheExpired(cacheKey, CATEGORY_CACHE_HOURS)) {
            // Emit cached content
            emit(cachedContent)
            
            // Prefetch images in the background
            prefetchImagesInBackground(cachedContent)
        } else {
            try {
                // Fetch from network
                val content = withContext(Dispatchers.IO) {
                    contentRepository.getTvShows()
                }
                
                // Get watch progress
                val watchProgressMap = tvCacheManager.getWatchProgressMap()
                
                // Transform to TV-specific model
                val tvContent = TvDataTransformer.transformMediaContentList(content, watchProgressMap)
                
                // Cache the result
                tvCacheManager.saveContentByCategory("tv_shows", tvContent)
                tvCacheManager.updateTimestamp(cacheKey)
                
                // Emit the result
                emit(tvContent)
                
                // Prefetch images in the background
                prefetchImagesInBackground(tvContent)
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching TV shows", e)
                
                // Emit cached content if available, even if expired
                if (cachedContent != null) {
                    emit(cachedContent)
                } else {
                    // Emit empty list if no cached content
                    emit(emptyList())
                }
            }
        }
    }.flowOn(Dispatchers.IO)
    
    override fun getSportsContent(): Flow<List<TvMediaContent>> = flow {
        // Check cache first
        val cacheKey = "sports_content"
        val cachedContent = tvCacheManager.getContentByCategory("sports")
        
        if (cachedContent != null && !tvCacheManager.isCacheExpired(cacheKey, CATEGORY_CACHE_HOURS)) {
            // Emit cached content
            emit(cachedContent)
            
            // Prefetch images in the background
            prefetchImagesInBackground(cachedContent)
        } else {
            try {
                // Fetch from network
                val content = withContext(Dispatchers.IO) {
                    contentRepository.getSportsContent()
                }
                
                // Get watch progress
                val watchProgressMap = tvCacheManager.getWatchProgressMap()
                
                // Transform to TV-specific model
                val tvContent = TvDataTransformer.transformMediaContentList(content, watchProgressMap)
                
                // Cache the result
                tvCacheManager.saveContentByCategory("sports", tvContent)
                tvCacheManager.updateTimestamp(cacheKey)
                
                // Emit the result
                emit(tvContent)
                
                // Prefetch images in the background
                prefetchImagesInBackground(tvContent)
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching sports content", e)
                
                // Emit cached content if available, even if expired
                if (cachedContent != null) {
                    emit(cachedContent)
                } else {
                    // Emit empty list if no cached content
                    emit(emptyList())
                }
            }
        }
    }.flowOn(Dispatchers.IO)
    
    override fun getKidsContent(): Flow<List<TvMediaContent>> = flow {
        // Check cache first
        val cacheKey = "kids_content"
        val cachedContent = tvCacheManager.getContentByCategory("kids")
        
        if (cachedContent != null && !tvCacheManager.isCacheExpired(cacheKey, CATEGORY_CACHE_HOURS)) {
            // Emit cached content
            emit(cachedContent)
            
            // Prefetch images in the background
            prefetchImagesInBackground(cachedContent)
        } else {
            try {
                // Fetch from network
                val content = withContext(Dispatchers.IO) {
                    contentRepository.getKidsContent()
                }
                
                // Get watch progress
                val watchProgressMap = tvCacheManager.getWatchProgressMap()
                
                // Transform to TV-specific model
                val tvContent = TvDataTransformer.transformMediaContentList(content, watchProgressMap)
                
                // Cache the result
                tvCacheManager.saveContentByCategory("kids", tvContent)
                tvCacheManager.updateTimestamp(cacheKey)
                
                // Emit the result
                emit(tvContent)
                
                // Prefetch images in the background
                prefetchImagesInBackground(tvContent)
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching kids content", e)
                
                // Emit cached content if available, even if expired
                if (cachedContent != null) {
                    emit(cachedContent)
                } else {
                    // Emit empty list if no cached content
                    emit(emptyList())
                }
            }
        }
    }.flowOn(Dispatchers.IO)
    
    override suspend fun getContentById(id: String): TvMediaContent? {
        // Check cache first
        val cacheKey = "content_$id"
        val cachedContent = tvCacheManager.getContentById(id)
        
        if (cachedContent != null && !tvCacheManager.isCacheExpired(cacheKey, CONTENT_CACHE_HOURS)) {
            // Return cached content
            return cachedContent
        }
        
        try {
            // Fetch from network
            val content = withContext(Dispatchers.IO) {
                contentRepository.getContentById(id)
            } ?: return null
            
            // Get watch progress
            val watchProgress = tvCacheManager.getWatchProgressMap()[id] ?: 0
            
            // Transform to TV-specific model
            val tvContent = TvDataTransformer.transformMediaContent(content, watchProgress)
            
            // Cache the result
            tvCacheManager.saveContentById(id, tvContent)
            tvCacheManager.updateTimestamp(cacheKey)
            
            // Prefetch images in the background
            prefetchImagesInBackground(listOf(tvContent))
            
            return tvContent
        } catch (e: Exception) {
            Log.e(TAG, "Error fetching content by ID: $id", e)
            
            // Return cached content if available, even if expired
            return cachedContent
        }
    }
    
    override fun searchContent(query: String): Flow<List<TvMediaContent>> = flow {
        if (query.isBlank()) {
            emit(emptyList())
            return@flow
        }
        
        try {
            // Search is always fetched from network to ensure fresh results
            val content = withContext(Dispatchers.IO) {
                contentRepository.searchContent(query)
            }
            
            // Get watch progress
            val watchProgressMap = tvCacheManager.getWatchProgressMap()
            
            // Transform to TV-specific model
            val tvContent = TvDataTransformer.transformMediaContentList(content, watchProgressMap)
            
            // Emit the result
            emit(tvContent)
            
            // Prefetch images in the background
            prefetchImagesInBackground(tvContent)
        } catch (e: Exception) {
            Log.e(TAG, "Error searching content: $query", e)
            emit(emptyList())
        }
    }.flowOn(Dispatchers.IO)
    
    override fun getPopularContent(): Flow<List<TvMediaContent>> = flow {
        // Check cache first
        val cacheKey = "popular_content"
        val cachedContent = tvCacheManager.getContentByCategory("popular")
        
        if (cachedContent != null && !tvCacheManager.isCacheExpired(cacheKey, CATEGORY_CACHE_HOURS)) {
            // Emit cached content
            emit(cachedContent)
            
            // Prefetch images in the background
            prefetchImagesInBackground(cachedContent)
        } else {
            try {
                // Fetch from network
                val content = withContext(Dispatchers.IO) {
                    contentRepository.getPopularContent()
                }
                
                // Get watch progress
                val watchProgressMap = tvCacheManager.getWatchProgressMap()
                
                // Transform to TV-specific model
                val tvContent = TvDataTransformer.transformMediaContentList(content, watchProgressMap)
                
                // Cache the result
                tvCacheManager.saveContentByCategory("popular", tvContent)
                tvCacheManager.updateTimestamp(cacheKey)
                
                // Emit the result
                emit(tvContent)
                
                // Prefetch images in the background
                prefetchImagesInBackground(tvContent)
            } catch (e: Exception) {
                Log.e(TAG, "Error fetching popular content", e)
                
                // Emit cached content if available, even if expired
                if (cachedContent != null) {
                    emit(cachedContent)
                } else {
                    // Emit empty list if no cached content
                    emit(emptyList())
                }
            }
        }
    }.flowOn(Dispatchers.IO)
    
    override suspend fun prefetchContent(contentIds: List<String>) {
        if (contentIds.isEmpty()) return
        
        try {
            withContext(Dispatchers.IO) {
                for (id in contentIds) {
                    // Skip if already in cache and not expired
                    val cacheKey = "content_$id"
                    if (tvCacheManager.getContentById(id) != null && 
                        !tvCacheManager.isCacheExpired(cacheKey, CONTENT_CACHE_HOURS)) {
                        continue
                    }
                    
                    // Fetch content
                    val content = contentRepository.getContentById(id) ?: continue
                    
                    // Get watch progress
                    val watchProgress = tvCacheManager.getWatchProgressMap()[id] ?: 0
                    
                    // Transform to TV-specific model
                    val tvContent = TvDataTransformer.transformMediaContent(content, watchProgress)
                    
                    // Cache the result
                    tvCacheManager.saveContentById(id, tvContent)
                    tvCacheManager.updateTimestamp(cacheKey)
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error prefetching content", e)
        }
    }
    
    override suspend fun clearCache() {
        tvCacheManager.clearCache()
    }
    
    /**
     * Prefetch images for a list of TV media content
     * @param content The list of TV media content
     */
    private suspend fun prefetchImagesInBackground(content: List<TvMediaContent>) {
        try {
            // Extract image URLs
            val imageUrls = mutableListOf<String>()
            
            for (item in content) {
                if (item.imageUrl.isNotEmpty()) {
                    imageUrls.add(item.imageUrl)
                }
                if (item.backdropUrl.isNotEmpty()) {
                    imageUrls.add(item.backdropUrl)
                }
            }
            
            // Prefetch images
            tvCacheManager.prefetchImages(imageUrls)
        } catch (e: Exception) {
            Log.e(TAG, "Error prefetching images", e)
        }
    }
} 
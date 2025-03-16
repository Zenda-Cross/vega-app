package com.vega.shared.repositories

import com.vega.shared.models.MediaContent
import java.util.*
import kotlin.random.Random

/**
 * MockContentRepository is a mock implementation of ContentRepository for testing.
 */
class MockContentRepository : ContentRepository {
    
    private val allContent = mutableListOf<MediaContent>()
    
    init {
        // Generate mock content
        generateMockContent()
    }
    
    override suspend fun getFeaturedContent(): List<MediaContent> {
        return allContent.filter { it.isFeatured }.shuffled().take(10)
    }
    
    override suspend fun getTrendingContent(): List<MediaContent> {
        return allContent.filter { it.isTrending }.shuffled().take(10)
    }
    
    override suspend fun getRecommendedContent(): List<MediaContent> {
        return allContent.shuffled().take(10)
    }
    
    override suspend fun getContinueWatchingContent(): List<MediaContent> {
        return allContent.shuffled().take(5)
    }
    
    override suspend fun getMovies(): List<MediaContent> {
        return allContent.filter { 
            it.genres.contains("Action") || 
            it.genres.contains("Drama") || 
            it.genres.contains("Comedy") || 
            it.genres.contains("Thriller") 
        }.shuffled().take(15)
    }
    
    override suspend fun getTvShows(): List<MediaContent> {
        return allContent.filter { 
            it.genres.contains("Drama") || 
            it.genres.contains("Comedy") || 
            it.genres.contains("Sci-Fi") 
        }.shuffled().take(15)
    }
    
    override suspend fun getSportsContent(): List<MediaContent> {
        return allContent.filter { 
            it.genres.contains("Sports") || 
            it.genres.contains("Football") || 
            it.genres.contains("Basketball") || 
            it.genres.contains("Tennis") || 
            it.genres.contains("Soccer") 
        }.shuffled().take(10)
    }
    
    override suspend fun getKidsContent(): List<MediaContent> {
        return allContent.filter { 
            it.genres.contains("Animation") || 
            it.genres.contains("Educational") || 
            it.genres.contains("Adventure") 
        }.shuffled().take(10)
    }
    
    override suspend fun getContentById(id: String): MediaContent? {
        return allContent.find { it.id == id } ?: createDummyContent(
            id = id,
            title = "Content $id",
            description = "This is a detailed description of the content. It provides information about the plot, cast, and other relevant details that would be interesting to the viewer.",
            categoryId = 0
        )
    }
    
    override suspend fun searchContent(query: String): List<MediaContent> {
        if (query.isBlank()) return emptyList()
        
        return allContent.filter { 
            it.title.contains(query, ignoreCase = true) || 
            it.description.contains(query, ignoreCase = true) ||
            it.genres.any { genre -> genre.contains(query, ignoreCase = true) }
        }.shuffled().take(10)
    }
    
    override suspend fun getPopularContent(): List<MediaContent> {
        // For mock purposes, we'll combine featured and trending content
        val popularContent = mutableListOf<MediaContent>()
        popularContent.addAll(allContent.filter { it.isFeatured })
        popularContent.addAll(allContent.filter { it.isTrending })
        
        // Return a shuffled list with no duplicates
        return popularContent.distinctBy { it.id }.shuffled().take(15)
    }
    
    /**
     * Generates mock content for testing
     */
    private fun generateMockContent() {
        val categories = listOf(
            "Featured" to 0L,
            "Trending" to 1L,
            "Recommended" to 2L,
            "Continue Watching" to 3L,
            "Movies" to 4L,
            "TV Shows" to 5L,
            "Sports" to 6L,
            "Kids" to 7L
        )
        
        val allGenres = listOf(
            "Action", "Drama", "Comedy", "Thriller", "Sci-Fi", 
            "Horror", "Romance", "Adventure", "Fantasy", "Animation", 
            "Documentary", "Sports", "Football", "Basketball", "Tennis", 
            "Soccer", "Educational"
        )
        
        // Generate content for each category
        categories.forEach { (categoryName, categoryId) ->
            val count = when (categoryId) {
                3L -> 5 // Continue Watching
                4L, 5L -> 15 // Movies and TV Shows
                else -> 10 // Other categories
            }
            
            for (i in 0 until count) {
                val isFeatured = categoryId == 0L || Random.nextBoolean() && Random.nextInt(10) > 8
                val isTrending = categoryId == 1L || Random.nextBoolean() && Random.nextInt(10) > 8
                
                val genreCount = Random.nextInt(1, 4)
                val genres = allGenres.shuffled().take(genreCount)
                
                val content = createDummyContent(
                    id = "$categoryId-$i",
                    title = "$categoryName Item $i",
                    description = "This is a $categoryName item. It's a great example of content in this category.",
                    isFeatured = isFeatured,
                    isTrending = isTrending,
                    categoryId = categoryId,
                    genres = genres
                )
                
                allContent.add(content)
            }
        }
    }
    
    /**
     * Creates dummy content for testing
     */
    private fun createDummyContent(
        id: String,
        title: String,
        description: String,
        isFeatured: Boolean = false,
        isTrending: Boolean = false,
        categoryId: Long,
        genres: List<String> = listOf("Action", "Drama", "Comedy").shuffled().take(2)
    ): MediaContent {
        return MediaContent(
            id = id,
            title = title,
            description = description,
            imageUrl = "https://placekitten.com/200/300?image=${(categoryId * 10) + id.hashCode() % 16}",
            backdropUrl = "https://placekitten.com/800/400?image=${(categoryId * 10) + id.hashCode() % 16}",
            videoUrl = "",
            duration = Random().nextInt(7200) + 1800, // Random duration between 30 and 150 minutes
            releaseYear = 2020 + Random().nextInt(4),
            rating = (Random().nextInt(50) + 50) / 10f, // Random rating between 5.0 and 10.0
            genres = genres,
            isFeatured = isFeatured,
            isTrending = isTrending
        )
    }
} 
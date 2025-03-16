package com.vega.tv.data

import com.vega.shared.models.MediaContent
import com.vega.shared.models.MediaInfo
import com.vega.tv.models.TvContentType
import com.vega.tv.models.TvMediaContent

/**
 * Utility class for transforming shared data models to TV-specific models.
 * Optimizes data for TV display and adds TV-specific properties.
 */
object TvDataTransformer {
    
    /**
     * Transform a shared MediaContent to a TV-specific TvMediaContent
     * 
     * @param content The shared MediaContent to transform
     * @param watchProgress Optional watch progress in seconds
     * @param isNew Whether this content should be marked as new
     * @param badgeText Optional badge text to display
     * @return A TV-optimized TvMediaContent
     */
    fun transformMediaContent(
        content: MediaContent,
        watchProgress: Int = 0,
        isNew: Boolean = false,
        badgeText: String? = null
    ): TvMediaContent {
        // Calculate watch progress percentage
        val progressPercent = if (content.duration > 0 && watchProgress > 0) {
            (watchProgress * 100 / content.duration).coerceIn(0, 100)
        } else {
            0
        }
        
        return TvMediaContent(
            id = content.id,
            title = content.title,
            description = content.description,
            imageUrl = optimizeImageUrl(content.imageUrl, ImageType.CARD),
            backdropUrl = optimizeImageUrl(content.backdropUrl, ImageType.BACKDROP),
            videoUrl = content.videoUrl,
            duration = content.duration,
            releaseYear = content.releaseYear,
            rating = content.rating,
            genres = content.genres,
            isFeatured = content.isFeatured,
            isTrending = content.isTrending,
            isNew = isNew,
            watchProgress = watchProgress,
            watchProgressPercent = progressPercent,
            badgeText = badgeText,
            contentType = determineContentType(content)
        )
    }
    
    /**
     * Transform a list of shared MediaContent to TV-specific TvMediaContent
     * 
     * @param contentList The list of shared MediaContent to transform
     * @param watchProgressMap Optional map of content ID to watch progress in seconds
     * @return A list of TV-optimized TvMediaContent
     */
    fun transformMediaContentList(
        contentList: List<MediaContent>,
        watchProgressMap: Map<String, Int> = emptyMap()
    ): List<TvMediaContent> {
        return contentList.map { content ->
            val watchProgress = watchProgressMap[content.id] ?: 0
            transformMediaContent(content, watchProgress)
        }
    }
    
    /**
     * Optimize an image URL for TV display
     * 
     * @param url The original image URL
     * @param type The type of image (card, backdrop, etc.)
     * @return An optimized image URL for TV display
     */
    private fun optimizeImageUrl(url: String, type: ImageType): String {
        // If the URL is empty, return it as is
        if (url.isEmpty()) return url
        
        // If the URL already contains TV-specific parameters, return it as is
        if (url.contains("tv=true")) return url
        
        // Add TV-specific parameters to the URL
        val separator = if (url.contains("?")) "&" else "?"
        return when (type) {
            ImageType.CARD -> "$url${separator}tv=true&width=313&height=470"
            ImageType.BACKDROP -> "$url${separator}tv=true&width=1280&height=720"
            ImageType.POSTER -> "$url${separator}tv=true&width=780&height=1170"
            ImageType.THUMBNAIL -> "$url${separator}tv=true&width=240&height=135"
        }
    }
    
    /**
     * Determine the content type based on the MediaContent
     */
    private fun determineContentType(content: MediaContent): TvContentType {
        return when {
            content.genres.any { it.equals("movie", ignoreCase = true) } -> TvContentType.MOVIE
            content.genres.any { it.equals("series", ignoreCase = true) } -> TvContentType.TV_SERIES
            content.genres.any { it.equals("sports", ignoreCase = true) } -> TvContentType.SPORTS
            content.genres.any { it.equals("kids", ignoreCase = true) } -> TvContentType.KIDS
            content.genres.any { it.equals("news", ignoreCase = true) } -> TvContentType.NEWS
            else -> TvContentType.UNKNOWN
        }
    }
    
    /**
     * Enum representing the type of image
     */
    private enum class ImageType {
        CARD,
        BACKDROP,
        POSTER,
        THUMBNAIL
    }
} 
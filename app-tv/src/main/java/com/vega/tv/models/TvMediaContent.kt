package com.vega.tv.models

import android.os.Parcelable
import androidx.leanback.widget.Row
import com.vega.shared.models.MediaContent
import kotlinx.parcelize.Parcelize

/**
 * TV-specific media content model that extends the shared MediaContent model.
 * Contains additional properties and formatting optimized for TV display.
 */
@Parcelize
data class TvMediaContent(
    // Base properties from MediaContent
    val id: String,
    val title: String,
    val description: String,
    val imageUrl: String,
    val backdropUrl: String,
    val videoUrl: String,
    val duration: Int,
    val releaseYear: Int,
    val rating: Float,
    val genres: List<String>,
    val isFeatured: Boolean,
    val isTrending: Boolean,
    
    // TV-specific properties
    val cardImageAspectRatio: Float = 0.667f, // 2:3 aspect ratio for card images
    val isPlayable: Boolean = true,
    val cardImageWidth: Int = 313, // Default width for Leanback card images
    val cardImageHeight: Int = 470, // Default height for Leanback card images
    val rowType: Int = Row.TYPE_DEFAULT,
    val rowPosition: Int = 0,
    val watchProgress: Int = 0, // Progress in seconds
    val watchProgressPercent: Int = 0, // Progress as percentage
    val isNew: Boolean = false,
    val badgeText: String? = null, // Text to display as a badge (e.g., "4K", "HDR")
    val contentType: TvContentType = TvContentType.UNKNOWN
) : Parcelable {
    
    /**
     * Creates a TvMediaContent from a standard MediaContent
     */
    constructor(content: MediaContent) : this(
        id = content.id,
        title = content.title,
        description = content.description,
        imageUrl = content.imageUrl,
        backdropUrl = content.backdropUrl,
        videoUrl = content.videoUrl,
        duration = content.duration,
        releaseYear = content.releaseYear,
        rating = content.rating,
        genres = content.genres,
        isFeatured = content.isFeatured,
        isTrending = content.isTrending,
        // TV-specific properties with default values
        isNew = false,
        watchProgress = 0,
        watchProgressPercent = 0,
        contentType = determineContentType(content)
    )
    
    /**
     * Get a formatted subtitle string for display in TV UI
     */
    fun getFormattedSubtitle(): String {
        val elements = mutableListOf<String>()
        
        // Add release year if available
        if (releaseYear > 0) {
            elements.add(releaseYear.toString())
        }
        
        // Add formatted duration if available
        if (duration > 0) {
            elements.add(formatDuration(duration))
        }
        
        // Add rating if available
        if (rating > 0) {
            elements.add(String.format("%.1f★", rating))
        }
        
        return elements.joinToString(" • ")
    }
    
    /**
     * Format duration from seconds to a human-readable string
     */
    private fun formatDuration(seconds: Int): String {
        val hours = java.util.concurrent.TimeUnit.SECONDS.toHours(seconds.toLong())
        val minutes = java.util.concurrent.TimeUnit.SECONDS.toMinutes(seconds.toLong()) % 60
        
        return if (hours > 0) {
            String.format("%dh %02dm", hours, minutes)
        } else {
            String.format("%dm", minutes)
        }
    }
    
    companion object {
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
    }
}

/**
 * Enum representing the type of content for TV display
 */
enum class TvContentType {
    MOVIE,
    TV_SERIES,
    SPORTS,
    KIDS,
    NEWS,
    UNKNOWN
} 
package com.vega.shared.utils

import com.vega.shared.models.MediaType
import com.vega.shared.models.Quality
import com.vega.shared.models.Stream

/**
 * Utility functions for media operations
 */
object MediaUtils {
    /**
     * Filter streams by quality
     * @param streams List of streams to filter
     * @param excludedQualities List of qualities to exclude
     * @return Filtered list of streams
     */
    fun filterStreamsByQuality(
        streams: List<Stream>,
        excludedQualities: List<Quality>
    ): List<Stream> {
        return streams.filter { stream ->
            stream.quality !in excludedQualities
        }
    }
    
    /**
     * Get the best quality stream from a list of streams
     * @param streams List of streams to choose from
     * @param preferredQualities List of qualities in order of preference
     * @return The best quality stream or null if no streams are available
     */
    fun getBestQualityStream(
        streams: List<Stream>,
        preferredQualities: List<Quality> = listOf(
            Quality.FHD_1080P,
            Quality.HD_720P,
            Quality.SD_480P,
            Quality.SD_360P
        )
    ): Stream? {
        for (quality in preferredQualities) {
            val stream = streams.find { it.quality == quality }
            if (stream != null) {
                return stream
            }
        }
        return streams.firstOrNull()
    }
    
    /**
     * Determine the media type from a string
     * @param typeString String representation of the media type
     * @return The corresponding MediaType enum value
     */
    fun getMediaTypeFromString(typeString: String?): MediaType {
        return when (typeString?.lowercase()) {
            "movie" -> MediaType.MOVIE
            "series", "tv", "show" -> MediaType.SERIES
            "anime" -> MediaType.ANIME
            else -> MediaType.UNKNOWN
        }
    }
    
    /**
     * Format file size for display
     * @param bytes Size in bytes
     * @return Formatted string (e.g., "1.5 MB")
     */
    fun formatFileSize(bytes: Long): String {
        if (bytes <= 0) return "0 B"
        
        val units = arrayOf("B", "KB", "MB", "GB", "TB")
        val digitGroups = (Math.log10(bytes.toDouble()) / Math.log10(1024.0)).toInt()
        
        return String.format(
            "%.1f %s",
            bytes / Math.pow(1024.0, digitGroups.toDouble()),
            units[digitGroups]
        )
    }
} 
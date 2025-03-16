package com.vega.shared.models

/**
 * Represents a media item in the catalog
 */
data class MediaItem(
    val id: String,
    val title: String,
    val link: String,
    val imageUrl: String,
    val provider: String? = null,
    val type: MediaType = MediaType.UNKNOWN
)

/**
 * Represents a category of media items
 */
data class MediaCategory(
    val title: String,
    val filter: String,
    val items: List<MediaItem> = emptyList()
)

/**
 * Represents detailed information about a media item
 */
data class MediaInfo(
    val title: String,
    val imageUrl: String,
    val synopsis: String,
    val imdbId: String,
    val type: MediaType,
    val tags: List<String> = emptyList(),
    val cast: List<String> = emptyList(),
    val rating: String? = null,
    val episodes: List<Episode> = emptyList()
)

/**
 * Represents an episode or a direct link to media content
 */
data class Episode(
    val title: String,
    val link: String,
    val quality: String? = null,
    val type: MediaType = MediaType.UNKNOWN
)

/**
 * Represents a stream source for media playback
 */
data class Stream(
    val server: String,
    val link: String,
    val type: String,
    val quality: Quality? = null,
    val subtitles: List<Subtitle> = emptyList(),
    val headers: Map<String, String> = emptyMap()
)

/**
 * Represents a subtitle track
 */
data class Subtitle(
    val language: String,
    val url: String
)

/**
 * Enum representing the type of media
 */
enum class MediaType {
    MOVIE,
    SERIES,
    ANIME,
    UNKNOWN
}

/**
 * Enum representing the quality of a stream
 */
enum class Quality {
    SD_360P,
    SD_480P,
    HD_720P,
    FHD_1080P,
    UHD_2160P,
    UNKNOWN;
    
    companion object {
        fun fromString(value: String): Quality {
            return when (value) {
                "360" -> SD_360P
                "480" -> SD_480P
                "720" -> HD_720P
                "1080" -> FHD_1080P
                "2160" -> UHD_2160P
                else -> UNKNOWN
            }
        }
    }
} 
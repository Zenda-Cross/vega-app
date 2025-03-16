package com.vega.shared.models

import android.os.Parcelable
import kotlinx.parcelize.Parcelize

/**
 * MediaContent represents a media item that can be displayed in the app.
 * It contains all the necessary information for displaying and playing media content.
 */
@Parcelize
data class MediaContent(
    // Unique identifier for the content
    val id: String,
    
    // Basic information
    val title: String,
    val description: String,
    
    // Media URLs
    val imageUrl: String,
    val backdropUrl: String,
    val videoUrl: String,
    
    // Content metadata
    val duration: Int, // in seconds
    val releaseYear: Int,
    val rating: Float, // 0.0 to 10.0
    val genres: List<String>,
    
    // Flags for special categories
    val isFeatured: Boolean = false,
    val isTrending: Boolean = false
) : Parcelable 
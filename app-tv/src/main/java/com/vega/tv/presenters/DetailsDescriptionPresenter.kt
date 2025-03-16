package com.vega.tv.presenters

import android.content.Context
import android.text.TextUtils
import androidx.leanback.widget.AbstractDetailsDescriptionPresenter
import com.vega.shared.models.MediaContent
import java.util.concurrent.TimeUnit

/**
 * DetailsDescriptionPresenter is responsible for rendering detailed information about a MediaContent item.
 * It is used in the details screen to display title, subtitle, and body text.
 */
class DetailsDescriptionPresenter : AbstractDetailsDescriptionPresenter() {

    override fun onBindDescription(viewHolder: ViewHolder, item: Any) {
        if (item is MediaContent) {
            // Set the title
            viewHolder.title.text = item.title
            
            // Set the subtitle (year, duration, rating)
            val subtitle = buildSubtitle(viewHolder.view.context, item)
            viewHolder.subtitle.text = subtitle
            
            // Set the body text (description and genres)
            val body = buildBody(item)
            viewHolder.body.text = body
            
            // Allow the body text to be multi-line
            viewHolder.body.maxLines = 10
            viewHolder.body.ellipsize = TextUtils.TruncateAt.END
        }
    }
    
    /**
     * Build the subtitle text from the media content details
     */
    private fun buildSubtitle(context: Context, content: MediaContent): String {
        val elements = mutableListOf<String>()
        
        // Add release year if available
        if (content.releaseYear > 0) {
            elements.add(content.releaseYear.toString())
        }
        
        // Add formatted duration if available
        if (content.duration > 0) {
            elements.add(formatDuration(content.duration))
        }
        
        // Add rating if available
        if (content.rating > 0) {
            elements.add(String.format("%.1f★", content.rating))
        }
        
        return elements.joinToString(" • ")
    }
    
    /**
     * Build the body text from the media content details
     */
    private fun buildBody(content: MediaContent): String {
        val body = StringBuilder()
        
        // Add description
        body.append(content.description)
        
        // Add genres if available
        if (content.genres.isNotEmpty()) {
            body.append("\n\nGenres: ")
            body.append(content.genres.joinToString(", "))
        }
        
        return body.toString()
    }
    
    /**
     * Format duration from seconds to a human-readable string
     */
    private fun formatDuration(seconds: Int): String {
        val hours = TimeUnit.SECONDS.toHours(seconds.toLong())
        val minutes = TimeUnit.SECONDS.toMinutes(seconds.toLong()) % 60
        
        return if (hours > 0) {
            String.format("%dh %02dm", hours, minutes)
        } else {
            String.format("%dm", minutes)
        }
    }
} 
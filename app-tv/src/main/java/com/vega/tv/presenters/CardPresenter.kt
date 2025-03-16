package com.vega.tv.presenters

import android.content.Context
import android.graphics.drawable.Drawable
import android.util.Log
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.ProgressBar
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.leanback.widget.ImageCardView
import androidx.leanback.widget.Presenter
import com.bumptech.glide.Glide
import com.bumptech.glide.load.resource.bitmap.CenterCrop
import com.bumptech.glide.load.resource.bitmap.RoundedCorners
import com.bumptech.glide.request.RequestOptions
import com.vega.shared.models.MediaContent
import com.vega.tv.R
import com.vega.tv.models.TvMediaContent
import java.util.concurrent.TimeUnit
import kotlin.properties.Delegates

/**
 * CardPresenter is responsible for rendering MediaContent objects as cards in a Leanback UI.
 * It handles image loading, focus states, and proper styling for content cards.
 */
class CardPresenter : Presenter() {

    private val TAG = "CardPresenter"
    
    // Card dimensions
    private var mCardWidth by Delegates.notNull<Int>()
    private var mCardHeight by Delegates.notNull<Int>()
    
    // Default background and selection colors
    private var mDefaultCardImage: Drawable? = null
    private var mDefaultBackgroundColor: Int = 0
    private var mSelectedBackgroundColor: Int = 0
    
    // Corner radius for card images
    private var mCornerRadius: Int = 0
    
    override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
        Log.d(TAG, "onCreateViewHolder")
        
        val context = parent.context
        
        // Initialize default values if not already set
        if (!::mCardWidth.isInitialized) {
            mCardWidth = context.resources.getDimensionPixelSize(R.dimen.card_width)
            mCardHeight = context.resources.getDimensionPixelSize(R.dimen.card_height)
            mCornerRadius = context.resources.getDimensionPixelSize(R.dimen.card_corner_radius)
            mDefaultBackgroundColor = ContextCompat.getColor(context, R.color.background_card)
            mSelectedBackgroundColor = ContextCompat.getColor(context, R.color.background_card_selected)
            mDefaultCardImage = ContextCompat.getDrawable(context, R.drawable.placeholder_image)
        }
        
        // Create the ImageCardView
        val cardView = ImageCardView(context).apply {
            isFocusable = true
            isFocusableInTouchMode = true
            setBackgroundColor(mDefaultBackgroundColor)
            setMainImageDimensions(mCardWidth, mCardHeight)
            // Set card type to show only the image and title
            setCardType(ImageCardView.CARD_TYPE_INFO_UNDER_WITH_EXTRA)
            // Adjust info area padding
            setInfoVisibility(ImageCardView.CARD_REGION_VISIBLE_ALWAYS)
        }
        
        return ViewHolder(cardView)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
        val cardView = viewHolder.view as ImageCardView
        val context = cardView.context
        
        // Handle different content types
        when (item) {
            is TvMediaContent -> bindTvMediaContent(cardView, item, context)
            is MediaContent -> bindMediaContent(cardView, item, context)
            else -> {
                Log.e(TAG, "Unsupported item type: ${item.javaClass.name}")
                bindErrorCard(cardView, context)
            }
        }
    }

    override fun onUnbindViewHolder(viewHolder: ViewHolder) {
        Log.d(TAG, "onUnbindViewHolder")
        
        val cardView = viewHolder.view as ImageCardView
        
        // Cancel pending image requests to prevent memory leaks
        Glide.with(cardView.context).clear(cardView.mainImageView)
        
        // Reset the card
        cardView.badgeImage = null
        cardView.mainImage = null
    }
    
    /**
     * Sets the selected state of the card.
     * This is called when the card gains or loses focus.
     */
    override fun onViewAttachedToWindow(viewHolder: ViewHolder) {
        // Set up focus handling
        val cardView = viewHolder.view as ImageCardView
        
        // Add a state change listener to handle focus changes
        cardView.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                cardView.setBackgroundColor(mSelectedBackgroundColor)
                cardView.setInfoAreaBackgroundColor(mSelectedBackgroundColor)
                // Scale up the card slightly when focused
                cardView.animate().scaleX(1.05f).scaleY(1.05f).setDuration(150).start()
            } else {
                cardView.setBackgroundColor(mDefaultBackgroundColor)
                cardView.setInfoAreaBackgroundColor(mDefaultBackgroundColor)
                // Reset the scale when focus is lost
                cardView.animate().scaleX(1.0f).scaleY(1.0f).setDuration(150).start()
            }
        }
    }
    
    /**
     * Bind TV-specific media content to the card view
     */
    private fun bindTvMediaContent(cardView: ImageCardView, content: TvMediaContent, context: Context) {
        // Set card title and content
        cardView.titleText = content.title
        cardView.contentText = content.getFormattedSubtitle()
        
        // Set card dimensions
        val width = content.cardImageWidth.takeIf { it > 0 } ?: mCardWidth
        val height = content.cardImageHeight.takeIf { it > 0 } ?: mCardHeight
        
        // Set card type
        if (content.isNew) {
            // Add "NEW" badge
            cardView.badgeImage = ContextCompat.getDrawable(context, R.drawable.badge_new)
        } else if (content.watchProgressPercent > 0) {
            // Add progress indicator for partially watched content
            val progressDrawable = ContextCompat.getDrawable(context, R.drawable.progress_drawable)
            cardView.badgeImage = progressDrawable
            
            // Find progress bar in the card view
            val progressBar = cardView.findViewById<ProgressBar>(R.id.progress_indicator)
            if (progressBar != null) {
                progressBar.progress = content.watchProgressPercent
                progressBar.visibility = android.view.View.VISIBLE
            }
        } else if (content.badgeText != null) {
            // Add custom badge text
            val badgeTextView = cardView.findViewById<TextView>(R.id.badge_text)
            if (badgeTextView != null) {
                badgeTextView.text = content.badgeText
                badgeTextView.visibility = android.view.View.VISIBLE
            }
        }
        
        // Load image with Glide
        Glide.with(context)
            .load(content.imageUrl)
            .apply(RequestOptions()
                .transforms(CenterCrop(), RoundedCorners(mCornerRadius))
                .placeholder(mDefaultCardImage)
                .error(mDefaultCardImage))
            .into(cardView.mainImageView)
        
        // Set card dimensions
        cardView.setMainImageDimensions(width, height)
    }
    
    /**
     * Bind standard media content to the card view
     */
    private fun bindMediaContent(cardView: ImageCardView, content: MediaContent, context: Context) {
        // Set card title and content
        cardView.titleText = content.title
        
        // Create subtitle text
        val subtitle = buildSubtitle(content)
        cardView.contentText = subtitle
        
        // Load image with Glide
        Glide.with(context)
            .load(content.imageUrl)
            .apply(RequestOptions()
                .transforms(CenterCrop(), RoundedCorners(mCornerRadius))
                .placeholder(mDefaultCardImage)
                .error(mDefaultCardImage))
            .into(cardView.mainImageView)
        
        // Set card dimensions
        cardView.setMainImageDimensions(mCardWidth, mCardHeight)
    }
    
    /**
     * Bind error card when content type is not supported
     */
    private fun bindErrorCard(cardView: ImageCardView, context: Context) {
        // Set card title and content
        cardView.titleText = context.getString(R.string.error_title)
        cardView.contentText = context.getString(R.string.error_content)
        
        // Set error image
        cardView.mainImage = mDefaultCardImage
        
        // Set card dimensions
        cardView.setMainImageDimensions(mCardWidth, mCardHeight)
    }
    
    /**
     * Build subtitle text from media content
     */
    private fun buildSubtitle(content: MediaContent): String {
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
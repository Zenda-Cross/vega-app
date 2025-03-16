package com.vega.tv.utils

import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import android.widget.ImageView
import androidx.leanback.widget.BaseCardView
import androidx.leanback.widget.HorizontalGridView
import androidx.leanback.widget.VerticalGridView
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import com.bumptech.glide.RequestBuilder
import com.bumptech.glide.load.DecodeFormat
import com.bumptech.glide.load.engine.DiskCacheStrategy
import com.bumptech.glide.request.RequestOptions
import com.vega.tv.utils.TvMemoryManager
import java.lang.ref.WeakReference

/**
 * Rendering optimizer for Android TV applications.
 * Provides optimizations for UI rendering, image loading, and view recycling.
 */
class TvRenderingOptimizer(
    private val context: Context,
    private val memoryManager: TvMemoryManager
) {
    private val mainHandler = Handler(Looper.getMainLooper())
    private val trackedViews = mutableListOf<WeakReference<View>>()
    
    // Default image loading options optimized for TV
    private val defaultGlideOptions = RequestOptions()
        .diskCacheStrategy(DiskCacheStrategy.ALL)
        .format(DecodeFormat.PREFER_RGB_565) // Uses 2 bytes per pixel instead of 4
        .dontAnimate() // Animations handled by Leanback
    
    // Low memory image loading options
    private val lowMemoryGlideOptions = RequestOptions()
        .diskCacheStrategy(DiskCacheStrategy.ALL)
        .format(DecodeFormat.PREFER_RGB_565)
        .dontAnimate()
        .override(480, 270) // Lower resolution
    
    /**
     * Optimize a RecyclerView for TV rendering
     * @param recyclerView The RecyclerView to optimize
     */
    fun optimizeRecyclerView(recyclerView: RecyclerView) {
        // Set item prefetch to improve scrolling performance
        recyclerView.setItemViewCacheSize(20)
        
        if (recyclerView.layoutManager is RecyclerView.LayoutManager) {
            (recyclerView.layoutManager as? RecyclerView.LayoutManager)?.let { layoutManager ->
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    // Increase prefetch window for smoother scrolling
                    recyclerView.layoutManager?.isItemPrefetchEnabled = true
                }
            }
        }
        
        // Optimize for TV by disabling unnecessary animations
        recyclerView.itemAnimator?.changeDuration = 0
        recyclerView.itemAnimator?.moveDuration = 0
        
        // Add to tracked views
        addTrackedView(recyclerView)
    }
    
    /**
     * Optimize a HorizontalGridView for TV rendering
     * @param gridView The HorizontalGridView to optimize
     */
    fun optimizeHorizontalGridView(gridView: HorizontalGridView) {
        // Set item prefetch to improve scrolling performance
        gridView.setItemViewCacheSize(20)
        
        // Optimize for TV
        gridView.setWindowAlignment(HorizontalGridView.WINDOW_ALIGN_BOTH_EDGE)
        gridView.setWindowAlignmentOffsetPercent(50f)
        gridView.setItemAlignmentOffset(0)
        gridView.setItemAlignmentOffsetPercent(50f)
        
        // Disable layout animations for better performance
        gridView.layoutAnimation = null
        
        // Add to tracked views
        addTrackedView(gridView)
    }
    
    /**
     * Optimize a VerticalGridView for TV rendering
     * @param gridView The VerticalGridView to optimize
     */
    fun optimizeVerticalGridView(gridView: VerticalGridView) {
        // Set item prefetch to improve scrolling performance
        gridView.setItemViewCacheSize(20)
        
        // Optimize for TV
        gridView.setWindowAlignment(VerticalGridView.WINDOW_ALIGN_BOTH_EDGE)
        gridView.setWindowAlignmentOffsetPercent(50f)
        gridView.setItemAlignmentOffset(0)
        gridView.setItemAlignmentOffsetPercent(50f)
        
        // Disable layout animations for better performance
        gridView.layoutAnimation = null
        
        // Add to tracked views
        addTrackedView(gridView)
    }
    
    /**
     * Optimize a BaseCardView for TV rendering
     * @param cardView The BaseCardView to optimize
     */
    fun optimizeCardView(cardView: BaseCardView) {
        // Set hardware acceleration for better performance
        cardView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        
        // Add to tracked views
        addTrackedView(cardView)
    }
    
    /**
     * Load an image with optimized settings for TV
     * @param imageView The ImageView to load into
     * @param url The image URL
     * @param lowMemory Whether to use low memory options
     */
    fun loadImage(imageView: ImageView, url: String, lowMemory: Boolean = false) {
        // Check if we're under memory pressure
        val useMemoryOptimization = lowMemory || memoryManager.isUnderMemoryPressure()
        
        // Choose appropriate options
        val options = if (useMemoryOptimization) {
            lowMemoryGlideOptions
        } else {
            defaultGlideOptions
        }
        
        // Load the image
        Glide.with(context)
            .load(url)
            .apply(options)
            .into(imageView)
    }
    
    /**
     * Load an image with a placeholder for TV
     * @param imageView The ImageView to load into
     * @param url The image URL
     * @param placeholder The placeholder drawable
     * @param lowMemory Whether to use low memory options
     */
    fun loadImageWithPlaceholder(
        imageView: ImageView,
        url: String,
        placeholder: Drawable,
        lowMemory: Boolean = false
    ) {
        // Check if we're under memory pressure
        val useMemoryOptimization = lowMemory || memoryManager.isUnderMemoryPressure()
        
        // Choose appropriate options
        val options = if (useMemoryOptimization) {
            lowMemoryGlideOptions
        } else {
            defaultGlideOptions
        }
        
        // Load the image
        Glide.with(context)
            .load(url)
            .apply(options)
            .placeholder(placeholder)
            .into(imageView)
    }
    
    /**
     * Create a Glide request builder with TV-optimized settings
     * @param lowMemory Whether to use low memory options
     * @return RequestBuilder for further customization
     */
    fun createGlideRequest(lowMemory: Boolean = false): RequestBuilder<Drawable> {
        // Check if we're under memory pressure
        val useMemoryOptimization = lowMemory || memoryManager.isUnderMemoryPressure()
        
        // Choose appropriate options
        val options = if (useMemoryOptimization) {
            lowMemoryGlideOptions
        } else {
            defaultGlideOptions
        }
        
        // Create the request
        return Glide.with(context)
            .asDrawable()
            .apply(options)
    }
    
    /**
     * Add a view to be tracked for optimization
     * @param view The view to track
     */
    private fun addTrackedView(view: View) {
        // Clean up any null references first
        cleanupReferences()
        
        // Add the new view
        trackedViews.add(WeakReference(view))
        
        // Add a pre-draw listener to optimize rendering
        view.viewTreeObserver.addOnPreDrawListener(object : ViewTreeObserver.OnPreDrawListener {
            override fun onPreDraw(): Boolean {
                // Only optimize if view is still attached
                if (view.isAttachedToWindow) {
                    optimizeViewHierarchy(view)
                }
                return true
            }
        })
    }
    
    /**
     * Clean up null references in the tracked views list
     */
    private fun cleanupReferences() {
        trackedViews.removeAll { it.get() == null }
    }
    
    /**
     * Optimize a view hierarchy for rendering
     * @param view The root view to optimize
     */
    private fun optimizeViewHierarchy(view: View) {
        // Set hardware acceleration for complex views
        if (view is ViewGroup && view.childCount > 5) {
            view.setLayerType(View.LAYER_TYPE_HARDWARE, null)
        }
        
        // Optimize ImageViews
        if (view is ImageView) {
            optimizeImageView(view)
        }
        
        // Recursively optimize child views
        if (view is ViewGroup) {
            for (i in 0 until view.childCount) {
                val child = view.getChildAt(i)
                // Skip already optimized views
                if (child.getTag(R.id.tag_optimized) != true) {
                    optimizeViewHierarchy(child)
                    child.setTag(R.id.tag_optimized, true)
                }
            }
        }
    }
    
    /**
     * Optimize an ImageView for rendering
     * @param imageView The ImageView to optimize
     */
    private fun optimizeImageView(imageView: ImageView) {
        // Check if the drawable is a bitmap
        val drawable = imageView.drawable
        if (drawable is BitmapDrawable) {
            val bitmap = drawable.bitmap
            
            // Check if bitmap is large
            if (bitmap != null && !bitmap.isRecycled) {
                val width = bitmap.width
                val height = bitmap.height
                
                // If bitmap is large, use hardware acceleration
                if (width * height > 1000000) { // 1 megapixel
                    imageView.setLayerType(View.LAYER_TYPE_HARDWARE, null)
                }
            }
        }
    }
    
    /**
     * Trim memory for all tracked views
     * @param level The memory trim level
     */
    fun trimMemory(level: Int) {
        // Clean up references
        cleanupReferences()
        
        // Process remaining views
        for (viewRef in trackedViews) {
            val view = viewRef.get() ?: continue
            
            // Handle different view types
            when (view) {
                is RecyclerView -> {
                    view.recycledViewPool.clear()
                }
                is ImageView -> {
                    // Clear large bitmaps
                    val drawable = view.drawable
                    if (drawable is BitmapDrawable) {
                        val bitmap = drawable.bitmap
                        if (bitmap != null && !bitmap.isRecycled && 
                            bitmap.byteCount > 1000000) { // 1MB
                            view.setImageDrawable(null)
                        }
                    }
                }
            }
        }
    }
    
    companion object {
        // View tag for marking optimized views
        val R.id.tag_optimized: Int
            get() = android.R.id.custom
    }
} 
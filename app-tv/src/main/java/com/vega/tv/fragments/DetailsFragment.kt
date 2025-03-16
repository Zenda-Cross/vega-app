package com.vega.tv.fragments

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.drawable.Drawable
import android.os.Bundle
import android.util.Log
import android.view.View
import androidx.core.app.ActivityOptionsCompat
import androidx.core.content.ContextCompat
import androidx.leanback.app.DetailsSupportFragment
import androidx.leanback.app.DetailsSupportFragmentBackgroundController
import androidx.leanback.widget.*
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition
import com.vega.shared.models.MediaContent
import com.vega.shared.repositories.ContentRepository
import com.vega.tv.MainApplication
import com.vega.tv.PlayerActivity
import com.vega.tv.PlaybackActivity
import com.vega.tv.R
import com.vega.tv.presenters.CardPresenter
import com.vega.tv.presenters.DetailsDescriptionPresenter
import com.vega.tv.utils.TvNavigationHelper
import com.vega.tv.utils.TvPreferences
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import java.util.*

/**
 * DetailsFragment displays detailed information about a selected media content item.
 * It shows a large header image, content details, action buttons, and related content suggestions.
 */
class DetailsFragment : DetailsSupportFragment() {

    private val TAG = "DetailsFragment"
    
    // Controllers and adapters
    private lateinit var mDetailsBackground: DetailsSupportFragmentBackgroundController
    private lateinit var mPresenterSelector: ClassPresenterSelector
    private lateinit var mAdapter: ArrayObjectAdapter
    private lateinit var mContentRepository: ContentRepository
    private lateinit var mPreferences: TvPreferences
    
    // Content data
    private var mMediaContentId: String? = null
    private var mMediaContent: MediaContent? = null
    
    // Action IDs
    companion object {
        const val ACTION_WATCH = 1L
        const val ACTION_TRAILER = 2L
        const val ACTION_FAVORITE = 3L
        const val ACTION_WATCHLIST = 4L
        const val ACTION_SHARE = 5L
        
        const val RELATED_CONTENT_ROW = 0
        const val RECOMMENDED_CONTENT_ROW = 1
        
        const val EXTRA_MEDIA_CONTENT_ID = "media_content_id"
        
        /**
         * Creates a new instance of DetailsFragment with the given media content ID
         */
        fun newInstance(mediaContentId: String): DetailsFragment {
            return DetailsFragment().apply {
                arguments = Bundle().apply {
                    putString(EXTRA_MEDIA_CONTENT_ID, mediaContentId)
                }
            }
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Get the content repository and preferences
        mContentRepository = MainApplication.from(requireContext()).contentRepository
        mPreferences = MainApplication.from(requireContext()).preferences
        
        // Set up the background controller
        mDetailsBackground = DetailsSupportFragmentBackgroundController(this)
        
        // Get the media content ID from arguments
        mMediaContentId = arguments?.getString(EXTRA_MEDIA_CONTENT_ID)
        
        if (mMediaContentId == null) {
            Log.e(TAG, "No media content ID provided")
            showError(getString(R.string.error_loading_content))
            return
        }
        
        // Set up the presenter selector and adapter
        setupAdapter()
        
        // Load the media content
        loadMediaContent()
        
        // Set the on item view clicked listener
        setOnItemViewClickedListener { itemViewHolder, item, rowViewHolder, row ->
            if (item is MediaContent) {
                // Navigate to details for the clicked item
                TvNavigationHelper.navigateToDetails(requireActivity(), item)
            }
        }
        
        // Set the on item view selected listener for background updates
        setOnItemViewSelectedListener { itemViewHolder, item, rowViewHolder, row ->
            if (item is MediaContent && row.id.toInt() != RELATED_CONTENT_ROW) {
                updateBackground(item.backdropUrl)
            }
        }
    }
    
    /**
     * Set up the adapter with presenters for different row types
     */
    private fun setupAdapter() {
        // Create the presenter selector
        mPresenterSelector = ClassPresenterSelector()
        
        // Add the details presenter
        val detailsPresenter = FullWidthDetailsOverviewRowPresenter(
            DetailsDescriptionPresenter(),
            MovieDetailsOverviewLogoPresenter()
        )
        
        // Set the details presenter style
        detailsPresenter.backgroundColor = ContextCompat.getColor(requireContext(), R.color.background_dark)
        detailsPresenter.initialState = FullWidthDetailsOverviewRowPresenter.STATE_HALF
        
        // Set the participant listener
        detailsPresenter.setOnActionClickedListener { action ->
            handleActionClick(action)
        }
        
        // Add the presenter to the selector
        mPresenterSelector.addClassPresenter(DetailsOverviewRow::class.java, detailsPresenter)
        
        // Add the list row presenter
        val listRowPresenter = ListRowPresenter().apply {
            shadowEnabled = false
            selectEffectEnabled = true
        }
        mPresenterSelector.addClassPresenter(ListRow::class.java, listRowPresenter)
        
        // Create the adapter
        mAdapter = ArrayObjectAdapter(mPresenterSelector)
        
        // Set the adapter
        adapter = mAdapter
    }
    
    /**
     * Load the media content from the repository
     */
    private fun loadMediaContent() {
        // Show loading state
        progressBarManager.show()
        
        // Load content from repository
        lifecycleScope.launch {
            try {
                val content = mContentRepository.getContentById(mMediaContentId ?: "")
                
                if (content != null) {
                    mMediaContent = content
                    updateUI(content)
                } else {
                    // Show error if content not found
                    showError(getString(R.string.error_loading_content))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading content details", e)
                showError(getString(R.string.error_loading_content))
            } finally {
                progressBarManager.hide()
            }
        }
    }
    
    /**
     * Update the UI with the loaded content
     */
    private fun updateUI(content: MediaContent) {
        // Create the details overview row
        val row = DetailsOverviewRow(content)
        
        // Load the main image
        Glide.with(requireContext())
            .asBitmap()
            .load(content.imageUrl)
            .centerCrop()
            .error(R.drawable.placeholder_image)
            .into(object : CustomTarget<Bitmap>(
                resources.getDimensionPixelSize(R.dimen.detail_thumb_width),
                resources.getDimensionPixelSize(R.dimen.detail_thumb_height)
            ) {
                override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
                    row.setImageBitmap(requireContext(), resource)
                }
                
                override fun onLoadCleared(placeholder: Drawable?) {
                    // Do nothing
                }
            })
        
        // Add actions
        val actionsAdapter = SparseArrayObjectAdapter()
        
        // Watch action
        actionsAdapter.set(
            ACTION_WATCH.toInt(),
            Action(ACTION_WATCH, getString(R.string.watch_now))
        )
        
        // Trailer action
        actionsAdapter.set(
            ACTION_TRAILER.toInt(),
            Action(ACTION_TRAILER, getString(R.string.watch_trailer))
        )
        
        // Favorite action
        val isFavorite = mPreferences.getContinueWatchingIds().contains(content.id)
        actionsAdapter.set(
            ACTION_FAVORITE.toInt(),
            Action(
                ACTION_FAVORITE,
                if (isFavorite) getString(R.string.remove_from_watchlist) else getString(R.string.add_to_watchlist)
            )
        )
        
        // Share action
        actionsAdapter.set(
            ACTION_SHARE.toInt(),
            Action(ACTION_SHARE, getString(R.string.share))
        )
        
        row.actionsAdapter = actionsAdapter
        
        // Add the row to the adapter
        mAdapter.add(row)
        
        // Add related content row
        addRelatedContentRow(content)
        
        // Add recommended content row
        addRecommendedContentRow()
        
        // Load the backdrop image
        updateBackground(content.backdropUrl)
    }
    
    /**
     * Add a row of related content
     */
    private fun addRelatedContentRow(content: MediaContent) {
        // Create a list row adapter for related content
        val listRowAdapter = ArrayObjectAdapter(CardPresenter())
        
        // Load related content from repository
        lifecycleScope.launch {
            try {
                // In a real app, you would have a method to get related content
                // For now, we'll use the recommended content as a substitute
                val relatedContent = mContentRepository.getRecommendedContent()
                    .filter { it.id != content.id }
                    .take(10)
                
                // Add content to adapter
                relatedContent.forEach { relatedItem ->
                    listRowAdapter.add(relatedItem)
                }
                
                // Add row if it has content
                if (listRowAdapter.size() > 0) {
                    val header = HeaderItem(RELATED_CONTENT_ROW.toLong(), getString(R.string.related_content))
                    mAdapter.add(ListRow(header, listRowAdapter))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading related content", e)
            }
        }
    }
    
    /**
     * Add a row of recommended content
     */
    private fun addRecommendedContentRow() {
        // Create a list row adapter for recommended content
        val listRowAdapter = ArrayObjectAdapter(CardPresenter())
        
        // Load recommended content from repository
        lifecycleScope.launch {
            try {
                val recommendedContent = mContentRepository.getRecommendedContent()
                    .filter { it.id != mMediaContentId }
                    .take(10)
                
                // Add content to adapter
                recommendedContent.forEach { recommendedItem ->
                    listRowAdapter.add(recommendedItem)
                }
                
                // Add row if it has content
                if (listRowAdapter.size() > 0) {
                    val header = HeaderItem(RECOMMENDED_CONTENT_ROW.toLong(), getString(R.string.category_recommended))
                    mAdapter.add(ListRow(header, listRowAdapter))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading recommended content", e)
            }
        }
    }
    
    /**
     * Handle action button clicks
     */
    private fun handleActionClick(action: Action) {
        val content = mMediaContent ?: return
        
        when (action.id) {
            ACTION_WATCH -> {
                // Launch the playback activity
                val intent = PlaybackActivity.createIntent(
                    requireActivity(),
                    content.id,
                    0,
                    false
                )
                
                // Add the content to continue watching
                mPreferences.addToContinueWatching(content.id)
                
                // Start the activity with a shared element transition if possible
                val bundle = ActivityOptionsCompat.makeSceneTransitionAnimation(
                    requireActivity(),
                    (view?.findViewById(R.id.details_overview_image) ?: view) as View,
                    PlaybackActivity.SHARED_ELEMENT_NAME
                ).toBundle()
                
                startActivity(intent, bundle)
            }
            ACTION_TRAILER -> {
                // Launch the playback activity with trailer flag
                val intent = PlaybackActivity.createIntent(
                    requireActivity(),
                    content.id,
                    0,
                    true
                )
                startActivity(intent)
            }
            ACTION_FAVORITE -> {
                // Toggle favorite status
                val isFavorite = mPreferences.getContinueWatchingIds().contains(content.id)
                
                if (isFavorite) {
                    mPreferences.removeFromContinueWatching(content.id)
                    // Update the action text
                    updateAction(ACTION_FAVORITE, getString(R.string.add_to_watchlist))
                } else {
                    mPreferences.addToContinueWatching(content.id)
                    // Update the action text
                    updateAction(ACTION_FAVORITE, getString(R.string.remove_from_watchlist))
                }
            }
            ACTION_SHARE -> {
                // Share the content
                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "text/plain"
                    putExtra(Intent.EXTRA_SUBJECT, content.title)
                    putExtra(Intent.EXTRA_TEXT, "Check out ${content.title} on Vega TV!")
                }
                startActivity(Intent.createChooser(shareIntent, getString(R.string.share)))
            }
        }
    }
    
    /**
     * Update an action's text
     */
    private fun updateAction(actionId: Long, newText: String) {
        val detailsOverviewRow = mAdapter.get(0) as DetailsOverviewRow
        val action = detailsOverviewRow.actionsAdapter.get(actionId.toInt()) as Action
        action.label1 = newText
        detailsOverviewRow.actionsAdapter.notifyItemRangeChanged(actionId.toInt(), 1)
    }
    
    /**
     * Update the background with the given URI
     */
    private fun updateBackground(uri: String?) {
        if (uri.isNullOrEmpty()) {
            mDetailsBackground.enableParallax()
            mDetailsBackground.coverBitmap = ContextCompat.getDrawable(
                requireContext(),
                R.drawable.default_background
            )
            return
        }
        
        // Load the backdrop image
        Glide.with(requireContext())
            .asBitmap()
            .load(uri)
            .centerCrop()
            .error(R.drawable.default_background)
            .into(object : CustomTarget<Bitmap>() {
                override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
                    mDetailsBackground.enableParallax()
                    mDetailsBackground.coverBitmap = resource
                }
                
                override fun onLoadCleared(placeholder: Drawable?) {
                    // Do nothing
                }
            })
    }
    
    /**
     * Show an error message
     */
    private fun showError(message: String) {
        TvNavigationHelper.showError(
            requireActivity(),
            message,
            { loadMediaContent() }
        )
    }
    
    /**
     * Logo presenter for the details overview
     */
    inner class MovieDetailsOverviewLogoPresenter : DetailsOverviewLogoPresenter() {
        override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
            super.onBindViewHolder(viewHolder, item)
            
            // Add a click listener to the logo to play the content
            viewHolder.view.setOnClickListener {
                val content = mMediaContent ?: return@setOnClickListener
                val intent = PlaybackActivity.createIntent(
                    requireActivity(),
                    content.id
                )
                startActivity(intent)
            }
        }
    }
} 
package com.vega.tv

import android.content.Intent
import android.graphics.drawable.Drawable
import android.os.Bundle
import android.util.Log
import androidx.leanback.app.DetailsSupportFragment
import androidx.leanback.app.DetailsSupportFragmentBackgroundController
import androidx.leanback.widget.*
import androidx.core.content.ContextCompat
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition
import com.vega.shared.models.MediaContent
import com.vega.shared.repositories.MediaRepository
import com.vega.shared.repositories.ContentRepository
import com.vega.tv.presenters.DetailsDescriptionPresenter
import java.util.*
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch

/**
 * DetailsFragment displays detailed information about a media content item.
 */
class DetailsFragment : DetailsSupportFragment() {
    
    private val TAG = "DetailsFragment"
    
    private lateinit var mMediaRepository: MediaRepository
    private lateinit var mContentRepository: ContentRepository
    private lateinit var mDetailsBackground: DetailsSupportFragmentBackgroundController
    private lateinit var mPresenterSelector: ClassPresenterSelector
    private lateinit var mAdapter: ArrayObjectAdapter
    
    private var mMediaContentId: String? = null
    private var mMediaContent: MediaContent? = null
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Get the repositories from the application
        mMediaRepository = MainApplication.from(requireContext()).mediaRepository
        mContentRepository = MainApplication.from(requireContext()).contentRepository
        
        // Set up the background controller
        mDetailsBackground = DetailsSupportFragmentBackgroundController(this)
        
        // Get the media content ID from arguments
        mMediaContentId = arguments?.getString(ARG_MEDIA_CONTENT_ID)
        
        if (mMediaContentId == null) {
            Log.e(TAG, "No media content ID provided")
            requireActivity().finish()
            return
        }
        
        // Set up the presenter selector and adapter
        setupAdapter()
        
        // Load the media content
        loadMediaContent()
    }
    
    private fun setupAdapter() {
        // Create the presenter selector
        mPresenterSelector = ClassPresenterSelector()
        
        // Add the details presenter
        val detailsPresenter = FullWidthDetailsOverviewRowPresenter(DetailsDescriptionPresenter())
        
        // Set the background color
        detailsPresenter.backgroundColor = ContextCompat.getColor(requireContext(), R.color.background_dark)
        
        // Set the participant listener
        detailsPresenter.setOnActionClickedListener { action ->
            when (action.id) {
                ACTION_WATCH -> {
                    // Launch the player activity
                    mMediaContent?.let { content ->
                        val intent = Intent(requireActivity(), PlayerActivity::class.java)
                        intent.putExtra(PlayerActivity.MEDIA_CONTENT_ID, content.id)
                        startActivity(intent)
                    }
                }
                ACTION_TRAILER -> {
                    // Launch the player activity with trailer flag
                    mMediaContent?.let { content ->
                        val intent = Intent(requireActivity(), PlayerActivity::class.java)
                        intent.putExtra(PlayerActivity.MEDIA_CONTENT_ID, content.id)
                        intent.putExtra(PlayerActivity.IS_TRAILER, true)
                        startActivity(intent)
                    }
                }
                ACTION_WATCHLIST -> {
                    // Toggle watchlist status
                    // In a real app, you would update the repository
                    Log.d(TAG, "Toggle watchlist")
                }
                ACTION_SHARE -> {
                    // Share the content
                    mMediaContent?.let { content ->
                        val shareIntent = Intent(Intent.ACTION_SEND)
                        shareIntent.type = "text/plain"
                        shareIntent.putExtra(Intent.EXTRA_SUBJECT, content.title)
                        shareIntent.putExtra(Intent.EXTRA_TEXT, "Check out ${content.title} on Vega TV!")
                        startActivity(Intent.createChooser(shareIntent, getString(R.string.share)))
                    }
                }
            }
        }
        
        // Add the presenter to the selector
        mPresenterSelector.addClassPresenter(DetailsOverviewRow::class.java, detailsPresenter)
        
        // Add the list row presenter
        mPresenterSelector.addClassPresenter(ListRow::class.java, ListRowPresenter())
        
        // Create the adapter
        mAdapter = ArrayObjectAdapter(mPresenterSelector)
        
        // Set the adapter
        adapter = mAdapter
    }
    
    private fun loadMediaContent() {
        // Load content from repository
        lifecycleScope.launch {
            try {
                val content = mContentRepository.getContentById(mMediaContentId ?: "")
                
                if (content != null) {
                    mMediaContent = content
                    updateUI(content)
                } else {
                    // Fallback to dummy content
                    createDummyContent()
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading content details", e)
                
                // Fallback to dummy content
                createDummyContent()
            }
        }
    }
    
    private fun createDummyContent() {
        // Create a dummy content item based on the ID
        val id = mMediaContentId ?: "0"
        val content = MediaContent(
            id = id,
            title = "Media Title $id",
            description = "This is a detailed description of the media content. It provides information about the plot, cast, and other relevant details that would be interesting to the viewer.",
            imageUrl = "https://placekitten.com/200/300?image=${id.hashCode() % 16}",
            backdropUrl = "https://placekitten.com/800/400?image=${id.hashCode() % 16}",
            videoUrl = "",
            duration = Random().nextInt(7200) + 1800, // Random duration between 30 and 150 minutes
            releaseYear = 2020 + Random().nextInt(4),
            rating = (Random().nextInt(50) + 50) / 10f, // Random rating between 5.0 and 10.0
            genres = listOf("Action", "Drama", "Comedy", "Sci-Fi", "Thriller").shuffled().take(3),
            isFeatured = Random().nextBoolean(),
            isTrending = Random().nextBoolean()
        )
        
        mMediaContent = content
        
        // Update the UI with the content
        updateUI(content)
    }
    
    private fun updateUI(content: MediaContent) {
        // Create the details overview row
        val row = DetailsOverviewRow(content)
        
        // Load the main image
        Glide.with(requireContext())
            .load(content.imageUrl)
            .centerCrop()
            .error(R.drawable.default_background)
            .into(object : CustomTarget<Drawable>() {
                override fun onResourceReady(resource: Drawable, transition: Transition<in Drawable>?) {
                    row.imageDrawable = resource
                }
                
                override fun onLoadCleared(placeholder: Drawable?) {
                    // Do nothing
                }
            })
        
        // Add actions
        val actionsAdapter = SparseArrayObjectAdapter()
        actionsAdapter.set(ACTION_WATCH, Action(ACTION_WATCH.toLong(), getString(R.string.play)))
        actionsAdapter.set(ACTION_TRAILER, Action(ACTION_TRAILER.toLong(), getString(R.string.watch_trailer)))
        actionsAdapter.set(ACTION_WATCHLIST, Action(ACTION_WATCHLIST.toLong(), getString(R.string.add_to_watchlist)))
        actionsAdapter.set(ACTION_SHARE, Action(ACTION_SHARE.toLong(), getString(R.string.share)))
        row.actionsAdapter = actionsAdapter
        
        // Add the row to the adapter
        mAdapter.add(row)
        
        // Add related content row
        addRelatedContentRow(content)
        
        // Load the backdrop image
        loadBackdrop(content.backdropUrl)
    }
    
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
                    val header = HeaderItem(0, getString(R.string.related_content))
                    mAdapter.add(ListRow(header, listRowAdapter))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading related content", e)
                
                // Fallback to dummy content
                for (i in 0 until 10) {
                    val relatedContent = MediaContent(
                        id = "${content.id}-related-$i",
                        title = "Related ${content.title} $i",
                        description = "Related content description",
                        imageUrl = "https://placekitten.com/200/300?image=${(content.id.hashCode() + i) % 16}",
                        backdropUrl = "https://placekitten.com/800/400?image=${(content.id.hashCode() + i) % 16}",
                        videoUrl = "",
                        duration = Random().nextInt(7200) + 1800,
                        releaseYear = 2020 + Random().nextInt(4),
                        rating = (Random().nextInt(50) + 50) / 10f,
                        genres = content.genres.shuffled().take(2),
                        isFeatured = false,
                        isTrending = false
                    )
                    listRowAdapter.add(relatedContent)
                }
                
                // Create a header for the related content row
                val header = HeaderItem(0, getString(R.string.related_content))
                
                // Add the list row to the adapter
                mAdapter.add(ListRow(header, listRowAdapter))
            }
        }
    }
    
    private fun loadBackdrop(url: String) {
        // Load the backdrop image
        Glide.with(requireContext())
            .load(url)
            .centerCrop()
            .error(R.drawable.default_background)
            .into(object : CustomTarget<Drawable>() {
                override fun onResourceReady(resource: Drawable, transition: Transition<in Drawable>?) {
                    mDetailsBackground.enableParallax()
                    mDetailsBackground.coverBitmap = resource
                }
                
                override fun onLoadCleared(placeholder: Drawable?) {
                    // Do nothing
                }
            })
    }
    
    companion object {
        private const val ARG_MEDIA_CONTENT_ID = "media_content_id"
        
        // Action IDs
        private const val ACTION_WATCH = 1
        private const val ACTION_TRAILER = 2
        private const val ACTION_WATCHLIST = 3
        private const val ACTION_SHARE = 4
        
        /**
         * Create a new instance of the fragment with the given media content ID
         */
        fun newInstance(mediaContentId: String): DetailsFragment {
            val fragment = DetailsFragment()
            val args = Bundle()
            args.putString(ARG_MEDIA_CONTENT_ID, mediaContentId)
            fragment.arguments = args
            return fragment
        }
    }
} 
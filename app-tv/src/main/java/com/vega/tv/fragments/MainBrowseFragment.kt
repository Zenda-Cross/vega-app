package com.vega.tv.fragments

import android.content.Intent
import android.graphics.Bitmap
import android.graphics.drawable.Drawable
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.View
import androidx.core.content.ContextCompat
import androidx.leanback.app.BackgroundManager
import androidx.leanback.app.BrowseSupportFragment
import androidx.leanback.widget.*
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition
import com.vega.shared.models.MediaContent
import com.vega.shared.repositories.ContentRepository
import com.vega.shared.repositories.MediaRepository
import com.vega.tv.DetailsActivity
import com.vega.tv.MainApplication
import com.vega.tv.R
import com.vega.tv.SearchActivity
import com.vega.tv.SettingsActivity
import com.vega.tv.presenters.CardPresenter
import java.util.*
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import com.vega.tv.utils.TvNavigationHelper

/**
 * MainBrowseFragment is the main entry point for browsing content in the TV app.
 * It displays content categories in rows and handles navigation between them.
 */
class MainBrowseFragment : BrowseSupportFragment() {

    private val TAG = "MainBrowseFragment"
    
    private lateinit var mBackgroundManager: BackgroundManager
    private lateinit var mMediaRepository: MediaRepository
    private lateinit var mContentRepository: ContentRepository
    private lateinit var mRowsAdapter: ArrayObjectAdapter
    private lateinit var mHandler: Handler
    private var mDefaultBackground: Drawable? = null
    private var mBackgroundTimer: Timer? = null
    private var mBackgroundUri: String? = null
    
    // Category IDs
    private val CATEGORY_FEATURED = 0L
    private val CATEGORY_TRENDING = 1L
    private val CATEGORY_RECOMMENDED = 2L
    private val CATEGORY_CONTINUE_WATCHING = 3L
    private val CATEGORY_MOVIES = 4L
    private val CATEGORY_SHOWS = 5L
    private val CATEGORY_SPORTS = 6L
    private val CATEGORY_KIDS = 7L
    
    // Delay for background change
    private val BACKGROUND_UPDATE_DELAY = 300L
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Get the repositories from the application
        mMediaRepository = MainApplication.from(requireContext()).mediaRepository
        mContentRepository = MainApplication.from(requireContext()).contentRepository
        
        // Initialize handler
        mHandler = Handler(Looper.getMainLooper())
        
        // Set up the background manager
        setupBackgroundManager()
        
        // Set up UI elements
        setupUIElements()
        
        // Set up event listeners
        setupEventListeners()
        
        // Load rows
        loadRows()
    }
    
    /**
     * Sets up the background manager for the fragment
     */
    private fun setupBackgroundManager() {
        mBackgroundManager = BackgroundManager.getInstance(requireActivity())
        if (!mBackgroundManager.isAttached) {
            mBackgroundManager.attach(requireActivity().window)
        }
        
        mDefaultBackground = ContextCompat.getDrawable(requireContext(), R.drawable.default_background)
        mBackgroundTimer = Timer()
    }
    
    /**
     * Sets up UI elements like title, search icon, and headers
     */
    private fun setupUIElements() {
        title = getString(R.string.browse_title)
        
        // Set search icon color
        searchAffordanceColor = ContextCompat.getColor(requireContext(), R.color.search_opaque)
        
        // Set fastLane (or headers) background color
        brandColor = ContextCompat.getColor(requireContext(), R.color.fastlane_background)
        
        // Set page background color
        backgroundColor = ContextCompat.getColor(requireContext(), R.color.default_background)
        
        // Set search icon click listener
        setOnSearchClickedListener {
            val intent = Intent(activity, SearchActivity::class.java)
            startActivity(intent)
        }
        
        // Set settings icon and click listener
        setOnSettingsClickedListener {
            val intent = Intent(activity, SettingsActivity::class.java)
            startActivity(intent)
        }
        
        // Set headers state
        headersState = BrowseSupportFragment.HEADERS_ENABLED
        
        // Set header presentation style
        isHeadersTransitionOnBackEnabled = true
        
        // Set brand logo
        badgeDrawable = ContextCompat.getDrawable(requireContext(), R.drawable.app_banner)
    }
    
    /**
     * Sets up event listeners for item selection, clicking, and search
     */
    private fun setupEventListeners() {
        // Set item selection listener
        setOnItemViewSelectedListener(ItemViewSelectedListener())
        
        // Set item click listener
        setOnItemViewClickedListener(ItemViewClickedListener())
    }
    
    /**
     * Loads content rows from the repository
     */
    private fun loadRows() {
        mRowsAdapter = ArrayObjectAdapter(ListRowPresenter())
        
        // Create card presenter for all rows
        val cardPresenter = CardPresenter()
        
        // Load featured content
        loadFeaturedRow(cardPresenter)
        
        // Load trending content
        loadTrendingRow(cardPresenter)
        
        // Load recommended content
        loadRecommendedRow(cardPresenter)
        
        // Load continue watching content
        loadContinueWatchingRow(cardPresenter)
        
        // Load movies
        loadMoviesRow(cardPresenter)
        
        // Load TV shows
        loadShowsRow(cardPresenter)
        
        // Load sports
        loadSportsRow(cardPresenter)
        
        // Load kids content
        loadKidsRow(cardPresenter)
        
        // Set adapter
        adapter = mRowsAdapter
    }
    
    /**
     * Loads featured content row
     */
    private fun loadFeaturedRow(cardPresenter: CardPresenter) {
        val listRowAdapter = ArrayObjectAdapter(cardPresenter)
        
        // Load featured content from repository
        lifecycleScope.launch {
            try {
                val featuredContent = mContentRepository.getFeaturedContent()
                
                // Add content to adapter
                featuredContent.forEach { content ->
                    listRowAdapter.add(content)
                }
                
                // Add row if it has content
                if (listRowAdapter.size() > 0) {
                    val header = HeaderItem(CATEGORY_FEATURED, getString(R.string.category_featured))
                    mRowsAdapter.add(ListRow(header, listRowAdapter))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading featured content", e)
                
                // Fallback to dummy content
                for (i in 0 until 10) {
                    val content = createDummyContent(
                        id = "$CATEGORY_FEATURED-$i",
                        title = "Featured Item $i",
                        description = "Featured content description",
                        isFeatured = true,
                        categoryId = CATEGORY_FEATURED
                    )
                    listRowAdapter.add(content)
                }
                
                val header = HeaderItem(CATEGORY_FEATURED, getString(R.string.category_featured))
                mRowsAdapter.add(ListRow(header, listRowAdapter))
            }
        }
    }
    
    /**
     * Loads trending content row
     */
    private fun loadTrendingRow(cardPresenter: CardPresenter) {
        val listRowAdapter = ArrayObjectAdapter(cardPresenter)
        
        // Load trending content from repository
        lifecycleScope.launch {
            try {
                val trendingContent = mContentRepository.getTrendingContent()
                
                // Add content to adapter
                trendingContent.forEach { content ->
                    listRowAdapter.add(content)
                }
                
                // Add row if it has content
                if (listRowAdapter.size() > 0) {
                    val header = HeaderItem(CATEGORY_TRENDING, getString(R.string.category_trending))
                    mRowsAdapter.add(ListRow(header, listRowAdapter))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading trending content", e)
                
                // Fallback to dummy content
                for (i in 0 until 10) {
                    val content = createDummyContent(
                        id = "$CATEGORY_TRENDING-$i",
                        title = "Trending Item $i",
                        description = "Trending content description",
                        isTrending = true,
                        categoryId = CATEGORY_TRENDING
                    )
                    listRowAdapter.add(content)
                }
                
                val header = HeaderItem(CATEGORY_TRENDING, getString(R.string.category_trending))
                mRowsAdapter.add(ListRow(header, listRowAdapter))
            }
        }
    }
    
    /**
     * Loads recommended content row
     */
    private fun loadRecommendedRow(cardPresenter: CardPresenter) {
        val listRowAdapter = ArrayObjectAdapter(cardPresenter)
        
        // Load recommended content from repository
        lifecycleScope.launch {
            try {
                val recommendedContent = mContentRepository.getRecommendedContent()
                
                // Add content to adapter
                recommendedContent.forEach { content ->
                    listRowAdapter.add(content)
                }
                
                // Add row if it has content
                if (listRowAdapter.size() > 0) {
                    val header = HeaderItem(CATEGORY_RECOMMENDED, getString(R.string.category_recommended))
                    mRowsAdapter.add(ListRow(header, listRowAdapter))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading recommended content", e)
                
                // Fallback to dummy content
                for (i in 0 until 10) {
                    val content = createDummyContent(
                        id = "$CATEGORY_RECOMMENDED-$i",
                        title = "Recommended Item $i",
                        description = "Recommended content description",
                        categoryId = CATEGORY_RECOMMENDED
                    )
                    listRowAdapter.add(content)
                }
                
                val header = HeaderItem(CATEGORY_RECOMMENDED, getString(R.string.category_recommended))
                mRowsAdapter.add(ListRow(header, listRowAdapter))
            }
        }
    }
    
    /**
     * Loads continue watching content row
     */
    private fun loadContinueWatchingRow(cardPresenter: CardPresenter) {
        val listRowAdapter = ArrayObjectAdapter(cardPresenter)
        
        // Load continue watching content from repository
        lifecycleScope.launch {
            try {
                val continueWatchingContent = mContentRepository.getContinueWatchingContent()
                
                // Add content to adapter
                continueWatchingContent.forEach { content ->
                    listRowAdapter.add(content)
                }
                
                // Add row if it has content
                if (listRowAdapter.size() > 0) {
                    val header = HeaderItem(CATEGORY_CONTINUE_WATCHING, getString(R.string.category_continue_watching))
                    mRowsAdapter.add(ListRow(header, listRowAdapter))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading continue watching content", e)
                
                // Fallback to dummy content
                for (i in 0 until 5) {
                    val content = createDummyContent(
                        id = "$CATEGORY_CONTINUE_WATCHING-$i",
                        title = "Continue Watching Item $i",
                        description = "Continue watching content description",
                        categoryId = CATEGORY_CONTINUE_WATCHING
                    )
                    listRowAdapter.add(content)
                }
                
                val header = HeaderItem(CATEGORY_CONTINUE_WATCHING, getString(R.string.category_continue_watching))
                mRowsAdapter.add(ListRow(header, listRowAdapter))
            }
        }
    }
    
    /**
     * Loads movies row
     */
    private fun loadMoviesRow(cardPresenter: CardPresenter) {
        val listRowAdapter = ArrayObjectAdapter(cardPresenter)
        
        // Load movies from repository
        lifecycleScope.launch {
            try {
                val movies = mContentRepository.getMovies()
                
                // Add content to adapter
                movies.forEach { content ->
                    listRowAdapter.add(content)
                }
                
                // Add row if it has content
                if (listRowAdapter.size() > 0) {
                    val header = HeaderItem(CATEGORY_MOVIES, getString(R.string.category_movies))
                    mRowsAdapter.add(ListRow(header, listRowAdapter))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading movies", e)
                
                // Fallback to dummy content
                for (i in 0 until 15) {
                    val content = createDummyContent(
                        id = "$CATEGORY_MOVIES-$i",
                        title = "Movie $i",
                        description = "Movie description",
                        categoryId = CATEGORY_MOVIES,
                        genres = listOf("Action", "Drama", "Thriller").shuffled().take(2)
                    )
                    listRowAdapter.add(content)
                }
                
                val header = HeaderItem(CATEGORY_MOVIES, getString(R.string.category_movies))
                mRowsAdapter.add(ListRow(header, listRowAdapter))
            }
        }
    }
    
    /**
     * Loads TV shows row
     */
    private fun loadShowsRow(cardPresenter: CardPresenter) {
        val listRowAdapter = ArrayObjectAdapter(cardPresenter)
        
        // Load TV shows from repository
        lifecycleScope.launch {
            try {
                val tvShows = mContentRepository.getTvShows()
                
                // Add content to adapter
                tvShows.forEach { content ->
                    listRowAdapter.add(content)
                }
                
                // Add row if it has content
                if (listRowAdapter.size() > 0) {
                    val header = HeaderItem(CATEGORY_SHOWS, getString(R.string.category_shows))
                    mRowsAdapter.add(ListRow(header, listRowAdapter))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading TV shows", e)
                
                // Fallback to dummy content
                for (i in 0 until 15) {
                    val content = createDummyContent(
                        id = "$CATEGORY_SHOWS-$i",
                        title = "TV Show $i",
                        description = "TV Show description",
                        categoryId = CATEGORY_SHOWS,
                        genres = listOf("Comedy", "Drama", "Sci-Fi").shuffled().take(2)
                    )
                    listRowAdapter.add(content)
                }
                
                val header = HeaderItem(CATEGORY_SHOWS, getString(R.string.category_shows))
                mRowsAdapter.add(ListRow(header, listRowAdapter))
            }
        }
    }
    
    /**
     * Loads sports row
     */
    private fun loadSportsRow(cardPresenter: CardPresenter) {
        val listRowAdapter = ArrayObjectAdapter(cardPresenter)
        
        // Load sports content from repository
        lifecycleScope.launch {
            try {
                val sportsContent = mContentRepository.getSportsContent()
                
                // Add content to adapter
                sportsContent.forEach { content ->
                    listRowAdapter.add(content)
                }
                
                // Add row if it has content
                if (listRowAdapter.size() > 0) {
                    val header = HeaderItem(CATEGORY_SPORTS, getString(R.string.category_sports))
                    mRowsAdapter.add(ListRow(header, listRowAdapter))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading sports content", e)
                
                // Fallback to dummy content
                for (i in 0 until 10) {
                    val content = createDummyContent(
                        id = "$CATEGORY_SPORTS-$i",
                        title = "Sports Event $i",
                        description = "Sports event description",
                        categoryId = CATEGORY_SPORTS,
                        genres = listOf("Football", "Basketball", "Tennis", "Soccer").shuffled().take(1)
                    )
                    listRowAdapter.add(content)
                }
                
                val header = HeaderItem(CATEGORY_SPORTS, getString(R.string.category_sports))
                mRowsAdapter.add(ListRow(header, listRowAdapter))
            }
        }
    }
    
    /**
     * Loads kids content row
     */
    private fun loadKidsRow(cardPresenter: CardPresenter) {
        val listRowAdapter = ArrayObjectAdapter(cardPresenter)
        
        // Load kids content from repository
        lifecycleScope.launch {
            try {
                val kidsContent = mContentRepository.getKidsContent()
                
                // Add content to adapter
                kidsContent.forEach { content ->
                    listRowAdapter.add(content)
                }
                
                // Add row if it has content
                if (listRowAdapter.size() > 0) {
                    val header = HeaderItem(CATEGORY_KIDS, getString(R.string.category_kids))
                    mRowsAdapter.add(ListRow(header, listRowAdapter))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading kids content", e)
                
                // Fallback to dummy content
                for (i in 0 until 10) {
                    val content = createDummyContent(
                        id = "$CATEGORY_KIDS-$i",
                        title = "Kids Show $i",
                        description = "Kids content description",
                        categoryId = CATEGORY_KIDS,
                        genres = listOf("Animation", "Educational", "Adventure").shuffled().take(2)
                    )
                    listRowAdapter.add(content)
                }
                
                val header = HeaderItem(CATEGORY_KIDS, getString(R.string.category_kids))
                mRowsAdapter.add(ListRow(header, listRowAdapter))
            }
        }
    }
    
    /**
     * Creates dummy content for testing
     */
    private fun createDummyContent(
        id: String,
        title: String,
        description: String,
        isFeatured: Boolean = false,
        isTrending: Boolean = false,
        categoryId: Long,
        genres: List<String> = listOf("Action", "Drama", "Comedy").shuffled().take(2)
    ): MediaContent {
        return MediaContent(
            id = id,
            title = title,
            description = description,
            imageUrl = "https://placekitten.com/200/300?image=${(categoryId * 10) + id.hashCode() % 16}",
            backdropUrl = "https://placekitten.com/800/400?image=${(categoryId * 10) + id.hashCode() % 16}",
            videoUrl = "",
            duration = Random().nextInt(7200) + 1800, // Random duration between 30 and 150 minutes
            releaseYear = 2020 + Random().nextInt(4),
            rating = (Random().nextInt(50) + 50) / 10f, // Random rating between 5.0 and 10.0
            genres = genres,
            isFeatured = isFeatured,
            isTrending = isTrending
        )
    }
    
    /**
     * Updates the background with the given URI
     */
    private fun updateBackground(uri: String?) {
        mBackgroundTimer?.cancel()
        
        mBackgroundTimer = Timer()
        mBackgroundTimer?.schedule(object : TimerTask() {
            override fun run() {
                mHandler.post {
                    if (uri != null) {
                        mBackgroundUri = uri
                        
                        val width = mBackgroundManager.width
                        val height = mBackgroundManager.height
                        
                        Glide.with(requireContext())
                            .asBitmap()
                            .load(uri)
                            .centerCrop()
                            .error(mDefaultBackground)
                            .into(object : CustomTarget<Bitmap>(width, height) {
                                override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
                                    mBackgroundManager.setBitmap(resource)
                                }
                                
                                override fun onLoadCleared(placeholder: Drawable?) {
                                    mBackgroundManager.color = ContextCompat.getColor(requireContext(), R.color.background_dark)
                                }
                            })
                    } else {
                        mBackgroundManager.color = ContextCompat.getColor(requireContext(), R.color.background_dark)
                    }
                }
            }
        }, BACKGROUND_UPDATE_DELAY)
    }
    
    /**
     * Listener for item selection events
     */
    private inner class ItemViewSelectedListener : OnItemViewSelectedListener {
        override fun onItemSelected(
            itemViewHolder: Presenter.ViewHolder?,
            item: Any?,
            rowViewHolder: RowPresenter.ViewHolder?,
            row: Row?
        ) {
            if (item is MediaContent) {
                Log.d(TAG, "Item selected: ${item.title}")
                
                // Update background
                updateBackground(item.backdropUrl)
            }
        }
    }
    
    /**
     * Listener for item click events
     */
    private inner class ItemViewClickedListener : OnItemViewClickedListener {
        override fun onItemClicked(
            itemViewHolder: Presenter.ViewHolder,
            item: Any,
            rowViewHolder: RowPresenter.ViewHolder,
            row: Row
        ) {
            if (item is MediaContent) {
                Log.d(TAG, "Item clicked: ${item.title}")
                
                // Launch details activity
                val intent = Intent(requireActivity(), DetailsActivity::class.java)
                intent.putExtra(DetailsActivity.MEDIA_CONTENT_ID, item.id)
                startActivity(intent)
            }
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        
        // Cancel background timer
        mBackgroundTimer?.cancel()
        
        // Release background manager
        if (mBackgroundManager.isAttached) {
            mBackgroundManager.release()
        }
    }
    
    companion object {
        /**
         * Creates a new instance of MainBrowseFragment
         */
        fun newInstance(): MainBrowseFragment {
            return MainBrowseFragment()
        }
    }
} 
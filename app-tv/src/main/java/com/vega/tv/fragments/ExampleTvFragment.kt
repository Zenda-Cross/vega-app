package com.vega.tv.fragments

import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.leanback.app.BrowseSupportFragment
import androidx.leanback.widget.ArrayObjectAdapter
import androidx.leanback.widget.HeaderItem
import androidx.leanback.widget.ListRow
import androidx.leanback.widget.ListRowPresenter
import androidx.lifecycle.lifecycleScope
import com.vega.tv.MainApplication
import com.vega.tv.R
import com.vega.tv.presenters.CardPresenter
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch

/**
 * Example fragment that demonstrates how to use the TV repository.
 * Shows how to fetch and display content using the TV-specific repository.
 */
class ExampleTvFragment : BrowseSupportFragment() {
    
    private val TAG = "ExampleTvFragment"
    
    // Row IDs
    private val FEATURED_ROW = 0L
    private val TRENDING_ROW = 1L
    private val MOVIES_ROW = 2L
    private val TV_SHOWS_ROW = 3L
    
    // Adapters
    private lateinit var rowsAdapter: ArrayObjectAdapter
    
    // Repository
    private val tvRepository by lazy {
        (requireActivity().application as MainApplication).tvRepository
    }
    
    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        // Set title
        title = getString(R.string.app_name)
        
        // Set header state
        headersState = HEADERS_ENABLED
        
        // Set brand color
        brandColor = resources.getColor(R.color.primary_color, null)
        
        // Create row presenter
        val rowPresenter = ListRowPresenter()
        rowPresenter.shadowEnabled = true
        
        // Create rows adapter
        rowsAdapter = ArrayObjectAdapter(rowPresenter)
        
        // Set adapter
        adapter = rowsAdapter
        
        // Load content
        loadContent()
        
        return super.onCreateView(inflater, container, savedInstanceState)
    }
    
    /**
     * Load content from the TV repository
     */
    private fun loadContent() {
        // Create card presenter
        val cardPresenter = CardPresenter()
        
        // Load featured content
        loadFeaturedContent(cardPresenter)
        
        // Load trending content
        loadTrendingContent(cardPresenter)
        
        // Load movies
        loadMoviesContent(cardPresenter)
        
        // Load TV shows
        loadTvShowsContent(cardPresenter)
    }
    
    /**
     * Load featured content from the TV repository
     */
    private fun loadFeaturedContent(cardPresenter: CardPresenter) {
        val rowAdapter = ArrayObjectAdapter(cardPresenter)
        
        lifecycleScope.launch {
            try {
                tvRepository.getFeaturedContent().collectLatest { content ->
                    // Add content to adapter
                    rowAdapter.clear()
                    content.forEach { tvContent ->
                        rowAdapter.add(tvContent)
                    }
                    
                    // Add row if it has content
                    if (rowAdapter.size() > 0) {
                        val header = HeaderItem(FEATURED_ROW, getString(R.string.featured))
                        rowsAdapter.add(ListRow(header, rowAdapter))
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading featured content", e)
            }
        }
    }
    
    /**
     * Load trending content from the TV repository
     */
    private fun loadTrendingContent(cardPresenter: CardPresenter) {
        val rowAdapter = ArrayObjectAdapter(cardPresenter)
        
        lifecycleScope.launch {
            try {
                tvRepository.getTrendingContent().collectLatest { content ->
                    // Add content to adapter
                    rowAdapter.clear()
                    content.forEach { tvContent ->
                        rowAdapter.add(tvContent)
                    }
                    
                    // Add row if it has content
                    if (rowAdapter.size() > 0) {
                        val header = HeaderItem(TRENDING_ROW, getString(R.string.trending))
                        rowsAdapter.add(ListRow(header, rowAdapter))
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading trending content", e)
            }
        }
    }
    
    /**
     * Load movies content from the TV repository
     */
    private fun loadMoviesContent(cardPresenter: CardPresenter) {
        val rowAdapter = ArrayObjectAdapter(cardPresenter)
        
        lifecycleScope.launch {
            try {
                tvRepository.getMovies().collectLatest { content ->
                    // Add content to adapter
                    rowAdapter.clear()
                    content.forEach { tvContent ->
                        rowAdapter.add(tvContent)
                    }
                    
                    // Add row if it has content
                    if (rowAdapter.size() > 0) {
                        val header = HeaderItem(MOVIES_ROW, getString(R.string.movies))
                        rowsAdapter.add(ListRow(header, rowAdapter))
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading movies content", e)
            }
        }
    }
    
    /**
     * Load TV shows content from the TV repository
     */
    private fun loadTvShowsContent(cardPresenter: CardPresenter) {
        val rowAdapter = ArrayObjectAdapter(cardPresenter)
        
        lifecycleScope.launch {
            try {
                tvRepository.getTvShows().collectLatest { content ->
                    // Add content to adapter
                    rowAdapter.clear()
                    content.forEach { tvContent ->
                        rowAdapter.add(tvContent)
                    }
                    
                    // Add row if it has content
                    if (rowAdapter.size() > 0) {
                        val header = HeaderItem(TV_SHOWS_ROW, getString(R.string.tv_shows))
                        rowsAdapter.add(ListRow(header, rowAdapter))
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading TV shows content", e)
            }
        }
    }
    
    /**
     * Prefetch content for improved performance
     */
    private fun prefetchUpcomingContent() {
        lifecycleScope.launch {
            try {
                // Get popular content IDs
                val popularContentIds = mutableListOf<String>()
                tvRepository.getPopularContent().collectLatest { content ->
                    popularContentIds.addAll(content.map { it.id })
                    
                    // Prefetch content
                    tvRepository.prefetchContent(popularContentIds)
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error prefetching content", e)
            }
        }
    }
} 
package com.vega.tv.fragments

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognizerIntent
import android.text.TextUtils
import android.util.Log
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.leanback.app.SearchSupportFragment
import androidx.leanback.widget.*
import androidx.lifecycle.lifecycleScope
import com.vega.shared.models.MediaContent
import com.vega.shared.repositories.ContentRepository
import com.vega.tv.MainApplication
import com.vega.tv.R
import com.vega.tv.presenters.CardPresenter
import com.vega.tv.utils.TvNavigationHelper
import com.vega.tv.utils.TvPreferences
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.*

/**
 * SearchFragment handles search functionality for the TV app.
 * It provides search suggestions, processes search queries, and displays results in a TV-friendly format.
 */
class SearchFragment : SearchSupportFragment(), SearchSupportFragment.SearchResultProvider {

    private val TAG = "SearchFragment"
    
    // Repositories and preferences
    private lateinit var mContentRepository: ContentRepository
    private lateinit var mPreferences: TvPreferences
    
    // UI components
    private lateinit var mRowsAdapter: ArrayObjectAdapter
    private lateinit var mCardPresenter: CardPresenter
    
    // Search handling
    private var mSearchJob: Job? = null
    private val mHandler = Handler(Looper.getMainLooper())
    private val SEARCH_DELAY_MS = 300L
    
    // Recent searches
    private val MAX_RECENT_SEARCHES = 5
    private var mRecentSearches = mutableListOf<String>()
    
    companion object {
        private const val REQUEST_SPEECH = 1
        
        // Row IDs
        private const val SEARCH_RESULTS_ROW = 0
        private const val SUGGESTIONS_ROW = 1
        private const val RECENT_SEARCHES_ROW = 2
        private const val TRENDING_ROW = 3
        
        /**
         * Creates a new instance of SearchFragment
         */
        fun newInstance(): SearchFragment {
            return SearchFragment()
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Get repositories and preferences
        mContentRepository = MainApplication.from(requireContext()).contentRepository
        mPreferences = MainApplication.from(requireContext()).preferences
        
        // Load recent searches
        mRecentSearches = mPreferences.getRecentSearches().toMutableList()
        
        // Set up the search UI
        setupUI()
        
        // Set the search result provider
        setSearchResultProvider(this)
        
        // Set item clicked listener
        setOnItemViewClickedListener { itemViewHolder, item, rowViewHolder, row ->
            if (item is MediaContent) {
                // Navigate to details for the clicked item
                TvNavigationHelper.navigateToDetails(requireActivity(), item)
            } else if (item is String) {
                // Set the search query to the selected suggestion
                setSearchQuery(item, true)
            }
        }
        
        // Set item selected listener
        setOnItemViewSelectedListener { itemViewHolder, item, rowViewHolder, row ->
            // You could implement additional behavior when items are selected
        }
    }
    
    /**
     * Set up the search UI components
     */
    private fun setupUI() {
        // Set search UI properties
        setTitle(getString(R.string.search_title))
        setBadgeDrawable(requireActivity().getDrawable(R.drawable.app_banner))
        
        // Enable voice search
        setSearchAffordanceColors(
            ContextCompat.getColor(requireContext(), R.color.primary),
            ContextCompat.getColor(requireContext(), R.color.primary_dark)
        )
        setOnSearchClickedListener {
            startActivityForResult(
                Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                    putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                    putExtra(RecognizerIntent.EXTRA_PROMPT, getString(R.string.search_hint))
                },
                REQUEST_SPEECH
            )
        }
        
        // Create the rows adapter
        mRowsAdapter = ArrayObjectAdapter(ListRowPresenter())
        
        // Create the card presenter for media content
        mCardPresenter = CardPresenter()
        
        // Load initial content (trending and suggestions)
        loadInitialContent()
    }
    
    /**
     * Load initial content for the search screen
     */
    private fun loadInitialContent() {
        // Show loading indicator
        progressBarManager.show()
        
        lifecycleScope.launch {
            try {
                // Load trending content
                loadTrendingContent()
                
                // Load recent searches
                loadRecentSearches()
                
                // Load search suggestions
                loadSearchSuggestions()
            } catch (e: Exception) {
                Log.e(TAG, "Error loading initial content", e)
            } finally {
                progressBarManager.hide()
            }
        }
    }
    
    /**
     * Load trending content as a starting point
     */
    private fun loadTrendingContent() {
        lifecycleScope.launch {
            try {
                val trendingContent = mContentRepository.getTrendingContent()
                
                if (trendingContent.isNotEmpty()) {
                    val trendingAdapter = ArrayObjectAdapter(mCardPresenter)
                    trendingContent.forEach { content ->
                        trendingAdapter.add(content)
                    }
                    
                    val header = HeaderItem(TRENDING_ROW.toLong(), getString(R.string.category_trending))
                    mRowsAdapter.add(ListRow(header, trendingAdapter))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading trending content", e)
            }
        }
    }
    
    /**
     * Load recent searches from preferences
     */
    private fun loadRecentSearches() {
        if (mRecentSearches.isNotEmpty()) {
            val recentAdapter = ArrayObjectAdapter(StringPresenter())
            mRecentSearches.forEach { search ->
                recentAdapter.add(search)
            }
            
            val header = HeaderItem(RECENT_SEARCHES_ROW.toLong(), getString(R.string.recent_searches))
            mRowsAdapter.add(ListRow(header, recentAdapter))
        }
    }
    
    /**
     * Load search suggestions based on popular content
     */
    private fun loadSearchSuggestions() {
        lifecycleScope.launch {
            try {
                // In a real app, you would get these from a backend service
                // For now, we'll generate some suggestions based on content
                val popularContent = mContentRepository.getPopularContent()
                val suggestions = mutableListOf<String>()
                
                popularContent.forEach { content ->
                    // Add title as suggestion
                    suggestions.add(content.title)
                    
                    // Add genre as suggestion if not already in the list
                    content.genres.forEach { genre ->
                        if (!suggestions.contains(genre) && suggestions.size < 10) {
                            suggestions.add(genre)
                        }
                    }
                }
                
                if (suggestions.isNotEmpty()) {
                    val suggestionsAdapter = ArrayObjectAdapter(StringPresenter())
                    suggestions.take(10).forEach { suggestion ->
                        suggestionsAdapter.add(suggestion)
                    }
                    
                    val header = HeaderItem(SUGGESTIONS_ROW.toLong(), getString(R.string.search_suggestions))
                    mRowsAdapter.add(ListRow(header, suggestionsAdapter))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading search suggestions", e)
            }
        }
    }
    
    /**
     * Perform the search with the given query
     */
    private fun performSearch(query: String) {
        // Cancel any ongoing search
        mSearchJob?.cancel()
        
        // Show loading indicator
        progressBarManager.show()
        
        // Start a new search
        mSearchJob = lifecycleScope.launch {
            try {
                // Search for content
                val searchResults = mContentRepository.searchContent(query)
                
                // Update the rows adapter with search results
                updateSearchResults(query, searchResults)
                
                // Add to recent searches
                addToRecentSearches(query)
            } catch (e: Exception) {
                Log.e(TAG, "Error performing search", e)
                
                // Show empty results
                updateSearchResults(query, emptyList())
            } finally {
                progressBarManager.hide()
            }
        }
    }
    
    /**
     * Update the search results in the adapter
     */
    private fun updateSearchResults(query: String, results: List<MediaContent>) {
        // Remove previous search results
        for (i in mRowsAdapter.size() - 1 downTo 0) {
            val row = mRowsAdapter.get(i) as ListRow
            if (row.headerItem.id == SEARCH_RESULTS_ROW.toLong()) {
                mRowsAdapter.removeItems(i, 1)
                break
            }
        }
        
        // Add new search results
        if (results.isNotEmpty()) {
            val resultsAdapter = ArrayObjectAdapter(mCardPresenter)
            results.forEach { content ->
                resultsAdapter.add(content)
            }
            
            val header = HeaderItem(SEARCH_RESULTS_ROW.toLong(), getString(R.string.search_results_for, query))
            mRowsAdapter.add(0, ListRow(header, resultsAdapter))
        } else {
            // Show no results message
            val noResultsAdapter = ArrayObjectAdapter(StringPresenter())
            noResultsAdapter.add(getString(R.string.no_search_results))
            
            val header = HeaderItem(SEARCH_RESULTS_ROW.toLong(), getString(R.string.search_results_for, query))
            mRowsAdapter.add(0, ListRow(header, noResultsAdapter))
        }
    }
    
    /**
     * Add a query to recent searches
     */
    private fun addToRecentSearches(query: String) {
        // Don't add empty queries
        if (query.isBlank()) return
        
        // Remove if already exists
        mRecentSearches.remove(query)
        
        // Add to the beginning
        mRecentSearches.add(0, query)
        
        // Limit to max recent searches
        if (mRecentSearches.size > MAX_RECENT_SEARCHES) {
            mRecentSearches = mRecentSearches.take(MAX_RECENT_SEARCHES).toMutableList()
        }
        
        // Save to preferences
        mPreferences.saveRecentSearches(mRecentSearches)
        
        // Update the recent searches row
        updateRecentSearchesRow()
    }
    
    /**
     * Update the recent searches row in the adapter
     */
    private fun updateRecentSearchesRow() {
        // Remove previous recent searches row
        for (i in mRowsAdapter.size() - 1 downTo 0) {
            val row = mRowsAdapter.get(i) as ListRow
            if (row.headerItem.id == RECENT_SEARCHES_ROW.toLong()) {
                mRowsAdapter.removeItems(i, 1)
                break
            }
        }
        
        // Add updated recent searches
        if (mRecentSearches.isNotEmpty()) {
            val recentAdapter = ArrayObjectAdapter(StringPresenter())
            mRecentSearches.forEach { search ->
                recentAdapter.add(search)
            }
            
            val header = HeaderItem(RECENT_SEARCHES_ROW.toLong(), getString(R.string.recent_searches))
            
            // Add after search results if they exist
            var insertPosition = 0
            for (i in 0 until mRowsAdapter.size()) {
                val row = mRowsAdapter.get(i) as ListRow
                if (row.headerItem.id == SEARCH_RESULTS_ROW.toLong()) {
                    insertPosition = i + 1
                    break
                }
            }
            
            mRowsAdapter.add(insertPosition, ListRow(header, recentAdapter))
        }
    }
    
    /**
     * Handle activity result for speech recognition
     */
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == REQUEST_SPEECH && resultCode == Activity.RESULT_OK) {
            val results = data?.getStringArrayListExtra(RecognizerIntent.EXTRA_RESULTS)
            if (!results.isNullOrEmpty()) {
                setSearchQuery(results[0], true)
            }
        }
    }
    
    // SearchResultProvider implementation
    
    override fun getResultsAdapter(): ObjectAdapter {
        return mRowsAdapter
    }
    
    override fun onQueryTextChange(newQuery: String): Boolean {
        // Cancel previous delayed search
        mHandler.removeCallbacksAndMessages(null)
        
        if (!TextUtils.isEmpty(newQuery)) {
            // Delay search to avoid too many requests while typing
            mHandler.postDelayed({
                performSearch(newQuery)
            }, SEARCH_DELAY_MS)
        }
        return true
    }
    
    override fun onQueryTextSubmit(query: String): Boolean {
        // Cancel delayed search
        mHandler.removeCallbacksAndMessages(null)
        
        if (!TextUtils.isEmpty(query)) {
            // Perform search immediately
            performSearch(query)
        }
        return true
    }
    
    /**
     * Presenter for string items (suggestions and recent searches)
     */
    private inner class StringPresenter : Presenter() {
        override fun onCreateViewHolder(parent: ViewGroup): ViewHolder {
            val view = TextView(parent.context).apply {
                isFocusable = true
                isFocusableInTouchMode = true
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    resources.getDimensionPixelSize(R.dimen.search_item_height)
                )
                setTextColor(ContextCompat.getColor(context, R.color.white))
                setBackgroundColor(ContextCompat.getColor(context, android.R.color.transparent))
                gravity = Gravity.CENTER_VERTICAL
                setPadding(
                    resources.getDimensionPixelSize(R.dimen.padding_medium),
                    resources.getDimensionPixelSize(R.dimen.padding_small),
                    resources.getDimensionPixelSize(R.dimen.padding_medium),
                    resources.getDimensionPixelSize(R.dimen.padding_small)
                )
                textSize = 16f
            }
            
            return ViewHolder(view)
        }
        
        override fun onBindViewHolder(viewHolder: ViewHolder, item: Any) {
            val textView = viewHolder.view as TextView
            if (item is String) {
                textView.text = item
            }
        }
        
        override fun onUnbindViewHolder(viewHolder: ViewHolder) {
            // Nothing to do
        }
    }
} 
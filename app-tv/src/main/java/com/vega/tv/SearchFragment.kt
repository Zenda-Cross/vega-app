package com.vega.tv

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.leanback.app.SearchSupportFragment
import androidx.leanback.widget.*
import com.vega.shared.models.MediaContent
import com.vega.shared.repositories.MediaRepository
import com.vega.shared.repositories.ContentRepository
import com.vega.tv.presenters.CardPresenter
import java.util.*
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch

/**
 * SearchFragment handles the search functionality for the TV app.
 */
class SearchFragment : SearchSupportFragment(), SearchSupportFragment.SearchResultProvider {
    
    private val TAG = "SearchFragment"
    
    private lateinit var mMediaRepository: MediaRepository
    private lateinit var mContentRepository: ContentRepository
    private lateinit var mRowsAdapter: ArrayObjectAdapter
    private lateinit var mHandler: Handler
    private lateinit var mDelayedLoad: Runnable
    
    private var mQuery: String = ""
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Get the repositories from the application
        mMediaRepository = MainApplication.from(requireContext()).mediaRepository
        mContentRepository = MainApplication.from(requireContext()).contentRepository
        
        // Set up the adapter
        mRowsAdapter = ArrayObjectAdapter(ListRowPresenter())
        
        // Set up the handler for delayed search
        mHandler = Handler(Looper.getMainLooper())
        mDelayedLoad = Runnable { loadRows() }
        
        // Set the search result provider
        setSearchResultProvider(this)
        
        // Set the search click listener
        setOnItemViewClickedListener { itemViewHolder, item, rowViewHolder, row ->
            if (item is MediaContent) {
                Log.d(TAG, "Item clicked: ${item.title}")
                
                // Launch details activity
                val intent = Intent(requireActivity(), DetailsActivity::class.java)
                intent.putExtra(DetailsActivity.MEDIA_CONTENT_ID, item.id)
                startActivity(intent)
            }
        }
        
        // Set the search query listener
        setOnSearchClickedListener {
            Log.d(TAG, "Search clicked")
        }
    }
    
    override fun getResultsAdapter(): ObjectAdapter {
        return mRowsAdapter
    }
    
    override fun onQueryTextChange(newQuery: String): Boolean {
        Log.d(TAG, "onQueryTextChange: $newQuery")
        
        // Cancel any pending searches
        mHandler.removeCallbacks(mDelayedLoad)
        
        if (newQuery.isEmpty()) {
            mRowsAdapter.clear()
            return true
        }
        
        // Save the query
        mQuery = newQuery
        
        // Schedule a new search after a delay
        mHandler.postDelayed(mDelayedLoad, SEARCH_DELAY_MS)
        
        return true
    }
    
    override fun onQueryTextSubmit(query: String): Boolean {
        Log.d(TAG, "onQueryTextSubmit: $query")
        
        // Cancel any pending searches
        mHandler.removeCallbacks(mDelayedLoad)
        
        // Save the query
        mQuery = query
        
        // Load the results immediately
        loadRows()
        
        return true
    }
    
    private fun loadRows() {
        // Clear the adapter
        mRowsAdapter.clear()
        
        if (mQuery.isBlank()) {
            return
        }
        
        // Create card presenter
        val cardPresenter = CardPresenter()
        val listRowAdapter = ArrayObjectAdapter(cardPresenter)
        
        // Search content from repository
        lifecycleScope.launch {
            try {
                val searchResults = mContentRepository.searchContent(mQuery)
                
                // Add content to adapter
                searchResults.forEach { content ->
                    listRowAdapter.add(content)
                }
                
                // Add row if it has content
                if (listRowAdapter.size() > 0) {
                    val header = HeaderItem(0, getString(R.string.search_results))
                    mRowsAdapter.add(ListRow(header, listRowAdapter))
                } else {
                    // Show no results message
                    val header = HeaderItem(0, getString(R.string.no_search_results))
                    mRowsAdapter.add(ListRow(header, ArrayObjectAdapter()))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error searching content", e)
                
                // Fallback to dummy results
                for (i in 0 until 10) {
                    val content = MediaContent(
                        id = "search-$i",
                        title = "Result for '$mQuery' $i",
                        description = "This is a search result for '$mQuery'",
                        imageUrl = "https://placekitten.com/200/300?image=${mQuery.hashCode() + i}",
                        backdropUrl = "https://placekitten.com/800/400?image=${mQuery.hashCode() + i}",
                        videoUrl = "",
                        duration = Random().nextInt(7200) + 1800,
                        releaseYear = 2020 + Random().nextInt(4),
                        rating = (Random().nextInt(50) + 50) / 10f,
                        genres = listOf("Action", "Drama", "Comedy").shuffled().take(2),
                        isFeatured = false,
                        isTrending = false
                    )
                    listRowAdapter.add(content)
                }
                
                // Create a header for the results row
                val header = HeaderItem(0, getString(R.string.search_results))
                
                // Add the list row to the adapter
                mRowsAdapter.add(ListRow(header, listRowAdapter))
            }
        }
    }
    
    companion object {
        private const val SEARCH_DELAY_MS = 300L
    }
} 
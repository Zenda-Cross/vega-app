package com.vega.tv

import android.os.Bundle
import androidx.fragment.app.FragmentActivity
import com.vega.shared.repositories.ContentRepository
import com.vega.tv.fragments.SearchFragment

/**
 * SearchActivity allows users to search for media content.
 * It hosts a SearchFragment that handles the search functionality.
 */
class SearchActivity : FragmentActivity() {
    
    private lateinit var mContentRepository: ContentRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_search)
        
        // Get the content repository from the application
        mContentRepository = MainApplication.from(this).contentRepository
        
        // If this is the first creation, add the fragment
        if (savedInstanceState == null) {
            val fragment = SearchFragment.newInstance()
            supportFragmentManager.beginTransaction()
                .replace(R.id.search_fragment_container, fragment)
                .commit()
        }
    }
} 
package com.vega.tv

import android.os.Bundle
import androidx.fragment.app.FragmentActivity
import com.vega.tv.fragments.DetailsFragment
import com.vega.tv.utils.TvNavigationHelper

/**
 * DetailsActivity hosts the DetailsFragment and handles the display of detailed content information.
 */
class DetailsActivity : FragmentActivity() {

    companion object {
        const val MEDIA_CONTENT_ID = "media_content_id"
        const val SHARED_ELEMENT_NAME = "hero_image"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_details)
        
        // Get the media content ID from the intent
        val mediaContentId = intent.getStringExtra(MEDIA_CONTENT_ID)
        
        if (mediaContentId == null) {
            // Show error if no media content ID is provided
            TvNavigationHelper.showError(
                this,
                getString(R.string.error_loading_content),
                { finish() }
            )
            return
        }
        
        if (savedInstanceState == null) {
            // Create and add the details fragment
            val fragment = DetailsFragment.newInstance(mediaContentId)
            
            // Add the fragment to the container
            supportFragmentManager.beginTransaction()
                .replace(R.id.details_fragment_container, fragment)
                .commit()
        }
    }
} 
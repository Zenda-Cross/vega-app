package com.vega.tv.utils

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentActivity
import com.vega.shared.models.MediaContent
import com.vega.tv.DetailsActivity
import com.vega.tv.ErrorFragment
import com.vega.tv.PlayerActivity
import com.vega.tv.PlaybackActivity
import com.vega.tv.R
import com.vega.tv.SearchActivity

/**
 * Helper class for TV-specific navigation.
 * Provides methods for navigating between activities and fragments.
 */
object TvNavigationHelper {

    /**
     * Navigate to the details screen for a media content item.
     *
     * @param activity The current activity
     * @param mediaContent The media content to show details for
     */
    fun navigateToDetails(activity: Activity, mediaContent: MediaContent) {
        val intent = Intent(activity, DetailsActivity::class.java).apply {
            putExtra(DetailsActivity.MEDIA_CONTENT_ID, mediaContent.id)
        }
        activity.startActivity(intent)
    }

    /**
     * Navigate to the player screen for a media content item.
     *
     * @param activity The current activity
     * @param mediaContent The media content to play
     * @param startPosition The position to start playback from (in milliseconds)
     */
    fun navigateToPlayer(activity: Activity, mediaContent: MediaContent, startPosition: Long = 0) {
        val intent = PlaybackActivity.createIntent(
            activity,
            mediaContent.id,
            startPosition,
            false
        )
        activity.startActivity(intent)
    }

    /**
     * Navigate to the search screen.
     *
     * @param activity The current activity
     */
    fun navigateToSearch(activity: Activity) {
        val intent = Intent(activity, SearchActivity::class.java)
        activity.startActivity(intent)
    }

    /**
     * Show an error fragment.
     *
     * @param activity The current activity
     * @param message The error message to display
     * @param retryCallback The callback to invoke when the retry button is clicked
     * @param containerId The ID of the container to add the fragment to
     */
    fun showError(
        activity: FragmentActivity,
        message: String,
        retryCallback: (() -> Unit)? = null,
        containerId: Int = android.R.id.content
    ) {
        val errorFragment = ErrorFragment.newInstance(message, retryCallback)
        activity.supportFragmentManager.beginTransaction()
            .replace(containerId, errorFragment)
            .commit()
    }

    /**
     * Replace a fragment in a container.
     *
     * @param activity The current activity
     * @param fragment The fragment to add
     * @param containerId The ID of the container to add the fragment to
     * @param addToBackStack Whether to add the transaction to the back stack
     * @param tag The tag for the fragment
     */
    fun replaceFragment(
        activity: FragmentActivity,
        fragment: Fragment,
        containerId: Int = R.id.fragment_container,
        addToBackStack: Boolean = true,
        tag: String? = null
    ) {
        val transaction = activity.supportFragmentManager.beginTransaction()
            .replace(containerId, fragment, tag)
        
        if (addToBackStack) {
            transaction.addToBackStack(tag)
        }
        
        transaction.commit()
    }
} 
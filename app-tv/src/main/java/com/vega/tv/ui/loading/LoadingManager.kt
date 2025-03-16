package com.vega.tv.ui.loading

import androidx.fragment.app.FragmentManager
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/**
 * Manager class for handling loading states across the application.
 * Provides methods to show and hide loading indicators with optional delay.
 */
class LoadingManager(
    private val fragmentManager: FragmentManager,
    private val lifecycleOwner: LifecycleOwner,
    private val containerId: Int
) {
    companion object {
        private const val TAG_LOADING_FRAGMENT = "loading_fragment"
        private const val DEFAULT_LOADING_DELAY_MS = 300L
        private const val MIN_LOADING_DURATION_MS = 500L
    }

    private var loadingFragment: LoadingFragment? = null
    private var loadingJob: Job? = null
    private var loadingStartTime: Long = 0

    /**
     * Shows the loading indicator with an optional custom message and delay.
     *
     * @param message Optional custom loading message
     * @param delayMs Delay in milliseconds before showing the loading indicator
     */
    fun showLoading(message: String? = null, delayMs: Long = DEFAULT_LOADING_DELAY_MS) {
        // Cancel any existing loading job
        loadingJob?.cancel()

        loadingJob = lifecycleOwner.lifecycleScope.launch {
            if (delayMs > 0) {
                delay(delayMs)
            }

            if (loadingFragment == null) {
                loadingFragment = LoadingFragment.newInstance(message)
                loadingStartTime = System.currentTimeMillis()
                
                fragmentManager.beginTransaction()
                    .replace(containerId, loadingFragment!!, TAG_LOADING_FRAGMENT)
                    .commitAllowingStateLoss()
            } else if (message != null) {
                loadingFragment?.updateMessage(message)
            }
        }
    }

    /**
     * Hides the loading indicator with an optional minimum duration.
     *
     * @param ensureMinDuration Whether to ensure the loading indicator is shown for a minimum duration
     */
    fun hideLoading(ensureMinDuration: Boolean = true) {
        loadingJob?.cancel()

        loadingJob = lifecycleOwner.lifecycleScope.launch {
            // Calculate remaining time to meet minimum duration if needed
            if (ensureMinDuration && loadingStartTime > 0) {
                val elapsedTime = System.currentTimeMillis() - loadingStartTime
                val remainingTime = MIN_LOADING_DURATION_MS - elapsedTime
                
                if (remainingTime > 0) {
                    delay(remainingTime)
                }
            }

            // Remove the loading fragment
            loadingFragment?.let {
                fragmentManager.findFragmentByTag(TAG_LOADING_FRAGMENT)?.let { fragment ->
                    fragmentManager.beginTransaction()
                        .remove(fragment)
                        .commitAllowingStateLoss()
                }
                loadingFragment = null
            }
            
            loadingStartTime = 0
        }
    }

    /**
     * Updates the loading message.
     *
     * @param message The new message to display
     */
    fun updateLoadingMessage(message: String) {
        loadingFragment?.updateMessage(message)
    }

    /**
     * Cancels any pending loading operations.
     */
    fun cancelLoading() {
        loadingJob?.cancel()
        loadingJob = null
    }
} 
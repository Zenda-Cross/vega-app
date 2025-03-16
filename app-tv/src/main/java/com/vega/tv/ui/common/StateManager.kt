package com.vega.tv.ui.common

import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentManager
import com.vega.tv.ui.error.ErrorFragment
import com.vega.tv.ui.error.PlaybackErrorHandler
import com.vega.tv.ui.loading.LoadingFragment
import com.vega.tv.ui.loading.LoadingManager

/**
 * Manages state transitions between loading, error, and content states.
 * Provides a unified interface for handling these common UI states.
 */
class StateManager(
    private val fragmentManager: FragmentManager,
    private val containerId: Int,
    private val errorHandler: PlaybackErrorHandler,
    private val loadingManager: LoadingManager
) {
    companion object {
        private const val TAG_CONTENT_FRAGMENT = "content_fragment"
        private const val TAG_ERROR_FRAGMENT = "error_fragment"
    }

    private var contentFragment: Fragment? = null
    private var currentState: State = State.NONE

    /**
     * Possible UI states
     */
    enum class State {
        NONE,
        LOADING,
        ERROR,
        CONTENT
    }

    /**
     * Shows the loading state with an optional custom message.
     *
     * @param message Optional custom loading message
     */
    fun showLoading(message: String? = null) {
        if (currentState == State.LOADING) {
            // Update message if already in loading state
            message?.let { loadingManager.updateLoadingMessage(it) }
            return
        }

        // Hide any visible error fragment
        hideErrorFragment()
        
        // Show loading
        loadingManager.showLoading(message)
        currentState = State.LOADING
    }

    /**
     * Shows the error state for the given error.
     *
     * @param throwable The error that occurred
     * @param retryAction The action to perform on retry
     */
    fun showError(throwable: Throwable, retryAction: () -> Unit) {
        // Hide loading if visible
        loadingManager.hideLoading(false)
        
        // Create and show error fragment
        val errorFragment = errorHandler.createErrorFragment(throwable, retryAction)
        
        fragmentManager.beginTransaction()
            .replace(containerId, errorFragment, TAG_ERROR_FRAGMENT)
            .commitAllowingStateLoss()
            
        currentState = State.ERROR
    }

    /**
     * Shows the content fragment.
     *
     * @param fragment The content fragment to show
     * @param addToBackStack Whether to add the transaction to the back stack
     */
    fun showContent(fragment: Fragment, addToBackStack: Boolean = false) {
        // Store reference to content fragment
        contentFragment = fragment
        
        // Hide loading if visible
        loadingManager.hideLoading()
        
        // Hide error if visible
        hideErrorFragment()
        
        // Show content fragment
        val transaction = fragmentManager.beginTransaction()
            .replace(containerId, fragment, TAG_CONTENT_FRAGMENT)
            
        if (addToBackStack) {
            transaction.addToBackStack(null)
        }
        
        transaction.commitAllowingStateLoss()
        currentState = State.CONTENT
    }

    /**
     * Returns to the content state if it exists.
     *
     * @return true if returned to content, false otherwise
     */
    fun returnToContent(): Boolean {
        return contentFragment?.let {
            // Hide loading if visible
            loadingManager.hideLoading(false)
            
            // Hide error if visible
            hideErrorFragment()
            
            // Show content fragment
            fragmentManager.beginTransaction()
                .replace(containerId, it, TAG_CONTENT_FRAGMENT)
                .commitAllowingStateLoss()
                
            currentState = State.CONTENT
            true
        } ?: false
    }

    /**
     * Gets the current UI state.
     *
     * @return The current state
     */
    fun getCurrentState(): State {
        return currentState
    }

    /**
     * Hides the error fragment if it exists.
     */
    private fun hideErrorFragment() {
        fragmentManager.findFragmentByTag(TAG_ERROR_FRAGMENT)?.let { fragment ->
            fragmentManager.beginTransaction()
                .remove(fragment)
                .commitAllowingStateLoss()
        }
    }
} 
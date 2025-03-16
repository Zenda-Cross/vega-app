package com.vega.tv.ui.player

import android.os.Bundle
import androidx.fragment.app.FragmentActivity
import com.vega.tv.R
import com.vega.tv.ui.common.StateManager
import com.vega.tv.ui.error.PlaybackErrorHandler
import com.vega.tv.ui.loading.LoadingManager

/**
 * Base activity for player implementations.
 * Handles common player functionality including state management.
 */
abstract class BasePlayerActivity : FragmentActivity() {
    
    private lateinit var stateManager: StateManager
    private lateinit var errorHandler: PlaybackErrorHandler
    private lateinit var loadingManager: LoadingManager
    
    // Container ID for fragments
    protected val fragmentContainerId: Int = R.id.fragment_container
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(getLayoutResourceId())
        
        // Initialize components
        initializeComponents()
        
        // Setup player
        setupPlayer()
    }
    
    /**
     * Initialize state management components.
     */
    private fun initializeComponents() {
        // Create error handler
        errorHandler = PlaybackErrorHandler(this)
        
        // Create loading manager
        loadingManager = LoadingManager(
            fragmentManager = supportFragmentManager,
            lifecycleOwner = this,
            containerId = fragmentContainerId
        )
        
        // Create state manager
        stateManager = StateManager(
            fragmentManager = supportFragmentManager,
            containerId = fragmentContainerId,
            errorHandler = errorHandler,
            loadingManager = loadingManager
        )
    }
    
    /**
     * Shows the loading state with an optional custom message.
     *
     * @param message Optional custom loading message
     */
    protected fun showLoading(message: String? = null) {
        stateManager.showLoading(message)
    }
    
    /**
     * Shows the error state for the given error.
     *
     * @param throwable The error that occurred
     * @param retryAction The action to perform on retry
     */
    protected fun showError(throwable: Throwable, retryAction: () -> Unit) {
        stateManager.showError(throwable, retryAction)
    }
    
    /**
     * Shows the content fragment.
     *
     * @param fragment The content fragment to show
     * @param addToBackStack Whether to add the transaction to the back stack
     */
    protected fun showContent(fragment: androidx.fragment.app.Fragment, addToBackStack: Boolean = false) {
        stateManager.showContent(fragment, addToBackStack)
    }
    
    /**
     * Returns to the content state if it exists.
     *
     * @return true if returned to content, false otherwise
     */
    protected fun returnToContent(): Boolean {
        return stateManager.returnToContent()
    }
    
    /**
     * Gets the current UI state.
     *
     * @return The current state
     */
    protected fun getCurrentState(): StateManager.State {
        return stateManager.getCurrentState()
    }
    
    /**
     * Gets the layout resource ID for this activity.
     * Default implementation returns a basic layout with a fragment container.
     *
     * @return The layout resource ID
     */
    protected open fun getLayoutResourceId(): Int {
        return R.layout.activity_player_base
    }
    
    /**
     * Sets up the player. Must be implemented by subclasses.
     */
    protected abstract fun setupPlayer()
    
    /**
     * Handles player errors.
     *
     * @param throwable The error that occurred
     */
    protected fun handlePlayerError(throwable: Throwable) {
        showError(throwable) {
            // Default retry action - can be overridden by subclasses
            setupPlayer()
        }
    }
    
    override fun onDestroy() {
        // Clean up resources
        cleanupPlayer()
        super.onDestroy()
    }
    
    /**
     * Cleans up player resources. Should be implemented by subclasses.
     */
    protected open fun cleanupPlayer() {
        // Default implementation does nothing
    }
} 
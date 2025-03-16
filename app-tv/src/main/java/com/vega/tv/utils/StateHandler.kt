package com.vega.tv.utils

import android.content.Context
import androidx.fragment.app.FragmentActivity
import androidx.fragment.app.FragmentManager
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.lifecycleScope
import com.vega.tv.R
import com.vega.tv.fragments.ErrorFragment
import com.vega.tv.fragments.LoadingFragment
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.launch

/**
 * StateHandler manages UI states (loading, error, content) and provides graceful error recovery.
 */
class StateHandler(
    private val activity: FragmentActivity,
    private val containerId: Int = android.R.id.content,
    private val lifecycleOwner: LifecycleOwner = activity
) {
    // State flow
    private val _uiState = MutableStateFlow<UiState>(UiState.Content)
    val uiState: StateFlow<UiState> = _uiState

    // Fragment tags
    private val LOADING_FRAGMENT_TAG = "loading_fragment"
    private val ERROR_FRAGMENT_TAG = "error_fragment"

    // Current fragments
    private var loadingFragment: LoadingFragment? = null
    private var errorFragment: ErrorFragment? = null

    // Network monitoring
    private var isMonitoringNetwork = false

    init {
        // Observe UI state changes
        lifecycleOwner.lifecycleScope.launch {
            uiState.collect { state ->
                updateUi(state)
            }
        }
    }

    /**
     * Show loading state
     */
    fun showLoading(message: String? = null, timeoutMs: Long = 30000L) {
        _uiState.value = UiState.Loading(message, timeoutMs)
    }

    /**
     * Show error state
     */
    fun showError(
        message: String,
        errorType: ErrorFragment.ErrorType = ErrorFragment.ErrorType.GENERIC,
        retryAction: (() -> Unit)? = null
    ) {
        _uiState.value = UiState.Error(message, errorType, retryAction)
    }

    /**
     * Show content state (hide loading and error)
     */
    fun showContent() {
        _uiState.value = UiState.Content
    }

    /**
     * Handle an exception and show appropriate error
     */
    fun handleError(throwable: Throwable, retryAction: (() -> Unit)? = null) {
        val context = activity.applicationContext
        val errorMessage = getErrorMessage(context, throwable)
        val errorType = getErrorType(throwable)
        
        showError(errorMessage, errorType, retryAction)
        
        // Start monitoring network if it's a network error
        if (errorType == ErrorFragment.ErrorType.NETWORK && !isMonitoringNetwork) {
            startNetworkMonitoring(retryAction)
        }
    }

    /**
     * Get error message based on exception
     */
    private fun getErrorMessage(context: Context, throwable: Throwable): String {
        return when {
            NetworkUtils.isNetworkError(throwable) -> context.getString(R.string.network_error)
            throwable.message?.contains("playback", ignoreCase = true) == true -> 
                context.getString(R.string.video_error)
            throwable.message?.contains("content", ignoreCase = true) == true -> 
                context.getString(R.string.error_loading_content)
            else -> context.getString(R.string.error_generic)
        }
    }

    /**
     * Get error type based on exception
     */
    private fun getErrorType(throwable: Throwable): ErrorFragment.ErrorType {
        return when {
            NetworkUtils.isNetworkError(throwable) -> ErrorFragment.ErrorType.NETWORK
            throwable.message?.contains("playback", ignoreCase = true) == true -> 
                ErrorFragment.ErrorType.PLAYBACK_ERROR
            throwable.message?.contains("content", ignoreCase = true) == true -> 
                ErrorFragment.ErrorType.CONTENT_UNAVAILABLE
            else -> ErrorFragment.ErrorType.GENERIC
        }
    }

    /**
     * Start monitoring network for automatic recovery
     */
    private fun startNetworkMonitoring(retryAction: (() -> Unit)?) {
        if (retryAction == null || isMonitoringNetwork) return
        
        isMonitoringNetwork = true
        
        lifecycleOwner.lifecycleScope.launch {
            NetworkUtils.getNetworkStatusFlow(activity).collect { isAvailable ->
                if (isAvailable && _uiState.value is UiState.Error) {
                    // Network is back, retry the action
                    retryAction()
                    isMonitoringNetwork = false
                    this.cancel() // Stop collecting
                }
            }
        }
    }

    /**
     * Update UI based on state
     */
    private fun updateUi(state: UiState) {
        val fragmentManager = activity.supportFragmentManager
        
        when (state) {
            is UiState.Loading -> showLoadingFragment(fragmentManager, state)
            is UiState.Error -> showErrorFragment(fragmentManager, state)
            is UiState.Content -> hideLoadingAndError(fragmentManager)
        }
    }

    /**
     * Show loading fragment
     */
    private fun showLoadingFragment(fragmentManager: FragmentManager, state: UiState.Loading) {
        // Hide error fragment if showing
        hideErrorFragment(fragmentManager)
        
        // Check if loading fragment already exists
        var fragment = fragmentManager.findFragmentByTag(LOADING_FRAGMENT_TAG) as? LoadingFragment
        
        if (fragment == null) {
            // Create new loading fragment
            fragment = LoadingFragment.newInstance(
                message = state.message,
                timeoutMs = state.timeoutMs,
                timeoutCallback = {
                    // On timeout, show error
                    showError(
                        activity.getString(R.string.error_generic),
                        ErrorFragment.ErrorType.GENERIC,
                        null
                    )
                }
            )
            
            // Add fragment
            fragmentManager.beginTransaction()
                .add(containerId, fragment, LOADING_FRAGMENT_TAG)
                .commitAllowingStateLoss()
        } else {
            // Update existing fragment
            state.message?.let { fragment.updateMessage(it) }
            fragment.resetTimeout()
        }
        
        loadingFragment = fragment
    }

    /**
     * Show error fragment
     */
    private fun showErrorFragment(fragmentManager: FragmentManager, state: UiState.Error) {
        // Hide loading fragment if showing
        hideLoadingFragment(fragmentManager)
        
        // Check if error fragment already exists
        var fragment = fragmentManager.findFragmentByTag(ERROR_FRAGMENT_TAG) as? ErrorFragment
        
        if (fragment == null) {
            // Create new error fragment
            fragment = ErrorFragment.newInstance(
                message = state.message,
                errorType = state.errorType,
                retryCallback = state.retryAction,
                dismissCallback = { showContent() }
            )
            
            // Add fragment
            fragmentManager.beginTransaction()
                .add(containerId, fragment, ERROR_FRAGMENT_TAG)
                .commitAllowingStateLoss()
        } else {
            // Update existing fragment
            fragment.updateErrorMessage(state.message)
            fragment.updateErrorType(state.errorType)
            fragment.setRetryCallback(state.retryAction)
        }
        
        errorFragment = fragment
    }

    /**
     * Hide loading and error fragments
     */
    private fun hideLoadingAndError(fragmentManager: FragmentManager) {
        hideLoadingFragment(fragmentManager)
        hideErrorFragment(fragmentManager)
    }

    /**
     * Hide loading fragment
     */
    private fun hideLoadingFragment(fragmentManager: FragmentManager) {
        val fragment = fragmentManager.findFragmentByTag(LOADING_FRAGMENT_TAG)
        if (fragment != null) {
            fragmentManager.beginTransaction()
                .remove(fragment)
                .commitAllowingStateLoss()
        }
        loadingFragment = null
    }

    /**
     * Hide error fragment
     */
    private fun hideErrorFragment(fragmentManager: FragmentManager) {
        val fragment = fragmentManager.findFragmentByTag(ERROR_FRAGMENT_TAG)
        if (fragment != null) {
            fragmentManager.beginTransaction()
                .remove(fragment)
                .commitAllowingStateLoss()
        }
        errorFragment = null
    }

    /**
     * UI State sealed class
     */
    sealed class UiState {
        object Content : UiState()
        data class Loading(val message: String? = null, val timeoutMs: Long = 30000L) : UiState()
        data class Error(
            val message: String,
            val errorType: ErrorFragment.ErrorType = ErrorFragment.ErrorType.GENERIC,
            val retryAction: (() -> Unit)? = null
        ) : UiState()
    }
} 
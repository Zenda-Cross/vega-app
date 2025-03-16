package com.vega.tv.ui.error

import android.content.Context
import com.vega.tv.R
import com.vega.tv.utils.NetworkUtils
import java.io.IOException

/**
 * Handler class for playback-related errors.
 * Provides appropriate error messages and actions based on error types.
 */
class PlaybackErrorHandler(private val context: Context) {

    /**
     * Determines the appropriate error message based on the error type.
     *
     * @param throwable The error that occurred
     * @return A user-friendly error message
     */
    fun getErrorMessage(throwable: Throwable): String {
        return when {
            NetworkUtils.isNetworkError(throwable) -> {
                if (!NetworkUtils.isNetworkAvailable(context)) {
                    context.getString(R.string.error_no_network)
                } else {
                    context.getString(R.string.error_network_problem)
                }
            }
            throwable is IOException -> context.getString(R.string.error_io_exception)
            throwable.message?.contains("403", ignoreCase = true) == true -> 
                context.getString(R.string.error_forbidden)
            throwable.message?.contains("404", ignoreCase = true) == true -> 
                context.getString(R.string.error_not_found)
            throwable.message?.contains("500", ignoreCase = true) == true -> 
                context.getString(R.string.error_server)
            throwable.message?.contains("DRM", ignoreCase = true) == true || 
            throwable.message?.contains("license", ignoreCase = true) == true -> 
                context.getString(R.string.error_drm)
            throwable.message?.contains("codec", ignoreCase = true) == true || 
            throwable.message?.contains("format", ignoreCase = true) == true -> 
                context.getString(R.string.error_unsupported_format)
            else -> context.getString(R.string.error_playback_failed)
        }
    }

    /**
     * Determines if the error is retryable.
     *
     * @param throwable The error that occurred
     * @return true if the error is retryable, false otherwise
     */
    fun isRetryable(throwable: Throwable): Boolean {
        return when {
            NetworkUtils.isNetworkError(throwable) -> true
            throwable.message?.contains("500", ignoreCase = true) == true -> true
            throwable.message?.contains("503", ignoreCase = true) == true -> true
            throwable.message?.contains("timeout", ignoreCase = true) == true -> true
            throwable is IOException -> true
            else -> false
        }
    }

    /**
     * Creates an appropriate ErrorFragment for the given error.
     *
     * @param throwable The error that occurred
     * @param retryAction The action to perform on retry
     * @return An ErrorFragment configured for the error
     */
    fun createErrorFragment(throwable: Throwable, retryAction: () -> Unit): ErrorFragment {
        val errorMessage = getErrorMessage(throwable)
        val isRetryable = isRetryable(throwable)
        
        return ErrorFragment.newInstance(
            errorMessage = errorMessage,
            showRetry = isRetryable,
            retryAction = if (isRetryable) retryAction else null
        )
    }
} 
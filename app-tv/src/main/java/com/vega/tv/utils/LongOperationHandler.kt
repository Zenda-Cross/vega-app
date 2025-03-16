package com.vega.tv.utils

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import androidx.fragment.app.FragmentActivity
import com.vega.tv.R
import com.vega.tv.fragments.ErrorFragment
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch
import java.util.concurrent.atomic.AtomicBoolean

/**
 * LongOperationHandler provides user feedback during long operations.
 * It shows loading indicators, handles errors, and provides progress updates.
 */
class LongOperationHandler(
    private val context: Context,
    private val stateHandler: StateHandler? = null,
    private val coroutineScope: CoroutineScope
) {
    // Operation state
    private var isOperationRunning = AtomicBoolean(false)
    private var currentJob: Job? = null
    private var operationStartTime: Long = 0
    
    // Progress updates
    private val progressHandler = Handler(Looper.getMainLooper())
    private var progressRunnable: Runnable? = null
    private var progressUpdateIntervalMs: Long = 0
    private var progressMessages: List<String> = emptyList()
    private var currentProgressIndex = 0

    /**
     * Execute a long operation with loading indicator and error handling
     */
    fun <T> execute(
        loadingMessage: String? = null,
        progressMessages: List<String> = emptyList(),
        progressUpdateIntervalMs: Long = 3000L,
        showToastOnSuccess: Boolean = false,
        successMessage: String? = null,
        operation: suspend () -> T,
        onSuccess: (T) -> Unit = {},
        onError: ((Throwable) -> Unit)? = null
    ) {
        // Check if operation is already running
        if (isOperationRunning.getAndSet(true)) {
            Toast.makeText(context, R.string.operation_already_running, Toast.LENGTH_SHORT).show()
            return
        }

        // Set up progress updates
        this.progressMessages = progressMessages
        this.progressUpdateIntervalMs = progressUpdateIntervalMs
        this.currentProgressIndex = 0

        // Show loading state
        stateHandler?.showLoading(loadingMessage)

        // Start operation
        operationStartTime = System.currentTimeMillis()
        currentJob = coroutineScope.launch {
            try {
                // Start progress updates if needed
                if (progressMessages.isNotEmpty()) {
                    startProgressUpdates(loadingMessage)
                }

                // Execute operation
                val result = operation()

                // Show success message if needed
                if (showToastOnSuccess) {
                    val message = successMessage ?: context.getString(R.string.operation_successful)
                    Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
                }

                // Show content state
                stateHandler?.showContent()

                // Call success callback
                onSuccess(result)
            } catch (e: Exception) {
                // Ignore cancellation exceptions
                if (e is CancellationException) return@launch

                // Handle error
                if (onError != null) {
                    onError(e)
                } else {
                    handleError(e)
                }
            } finally {
                // Stop progress updates
                stopProgressUpdates()

                // Reset operation state
                isOperationRunning.set(false)
                currentJob = null
            }
        }
    }

    /**
     * Cancel the current operation
     */
    fun cancelOperation() {
        currentJob?.cancel()
        stopProgressUpdates()
        stateHandler?.showContent()
        isOperationRunning.set(false)
        currentJob = null
    }

    /**
     * Start progress updates
     */
    private fun startProgressUpdates(initialMessage: String?) {
        // Stop any existing updates
        stopProgressUpdates()

        // Create new runnable
        progressRunnable = object : Runnable {
            override fun run() {
                if (progressMessages.isNotEmpty()) {
                    // Get next progress message
                    val message = progressMessages[currentProgressIndex]
                    
                    // Update loading message
                    stateHandler?.showLoading(message)
                    
                    // Increment index
                    currentProgressIndex = (currentProgressIndex + 1) % progressMessages.size
                    
                    // Schedule next update
                    progressHandler.postDelayed(this, progressUpdateIntervalMs)
                }
            }
        }

        // Schedule first update (after initial delay)
        progressHandler.postDelayed(progressRunnable!!, progressUpdateIntervalMs)
    }

    /**
     * Stop progress updates
     */
    private fun stopProgressUpdates() {
        progressRunnable?.let { progressHandler.removeCallbacks(it) }
        progressRunnable = null
    }

    /**
     * Handle error
     */
    private fun handleError(throwable: Throwable) {
        if (stateHandler != null) {
            // Use state handler to show error
            stateHandler.handleError(throwable) {
                // Retry action - could be implemented if needed
            }
        } else if (context is FragmentActivity) {
            // Show error toast
            val errorMessage = when {
                NetworkUtils.isNetworkError(throwable) -> context.getString(R.string.network_error)
                else -> context.getString(R.string.error_generic)
            }
            Toast.makeText(context, errorMessage, Toast.LENGTH_LONG).show()
        }
    }

    /**
     * Check if an operation is running
     */
    fun isOperationRunning(): Boolean {
        return isOperationRunning.get()
    }

    /**
     * Get operation duration in milliseconds
     */
    fun getOperationDuration(): Long {
        return if (isOperationRunning.get()) {
            System.currentTimeMillis() - operationStartTime
        } else {
            0
        }
    }
} 
package com.vega.tv.fragments

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ProgressBar
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.vega.tv.R

/**
 * LoadingFragment displays a loading animation optimized for TV.
 * It provides visual feedback for long-running operations.
 */
class LoadingFragment : Fragment() {

    private lateinit var mLoadingMessage: TextView
    private lateinit var mProgressBar: ProgressBar
    private var mTimeoutHandler: Handler? = null
    private var mTimeoutRunnable: Runnable? = null
    private var mTimeoutCallback: (() -> Unit)? = null
    private var mTimeoutDuration: Long = DEFAULT_TIMEOUT_MS

    companion object {
        private const val ARG_MESSAGE = "message"
        private const val ARG_TIMEOUT = "timeout"
        private const val DEFAULT_TIMEOUT_MS = 30000L // 30 seconds

        /**
         * Creates a new instance of LoadingFragment
         */
        fun newInstance(
            message: String? = null,
            timeoutMs: Long = DEFAULT_TIMEOUT_MS,
            timeoutCallback: (() -> Unit)? = null
        ): LoadingFragment {
            return LoadingFragment().apply {
                arguments = Bundle().apply {
                    putString(ARG_MESSAGE, message)
                    putLong(ARG_TIMEOUT, timeoutMs)
                }
                mTimeoutCallback = timeoutCallback
                mTimeoutDuration = timeoutMs
            }
        }
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_loading, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Initialize views
        mLoadingMessage = view.findViewById(R.id.loading_message)
        mProgressBar = view.findViewById(R.id.loading_progress)

        // Get arguments
        val message = arguments?.getString(ARG_MESSAGE)
        mTimeoutDuration = arguments?.getLong(ARG_TIMEOUT) ?: DEFAULT_TIMEOUT_MS

        // Set loading message if provided
        if (!message.isNullOrEmpty()) {
            mLoadingMessage.text = message
            mLoadingMessage.visibility = View.VISIBLE
        } else {
            mLoadingMessage.visibility = View.GONE
        }

        // Start timeout handler
        startTimeoutHandler()
    }

    /**
     * Start the timeout handler
     */
    private fun startTimeoutHandler() {
        if (mTimeoutCallback != null) {
            mTimeoutHandler = Handler(Looper.getMainLooper())
            mTimeoutRunnable = Runnable {
                mTimeoutCallback?.invoke()
            }
            mTimeoutHandler?.postDelayed(mTimeoutRunnable!!, mTimeoutDuration)
        }
    }

    /**
     * Cancel the timeout handler
     */
    private fun cancelTimeoutHandler() {
        mTimeoutRunnable?.let { mTimeoutHandler?.removeCallbacks(it) }
        mTimeoutHandler = null
        mTimeoutRunnable = null
    }

    /**
     * Update the loading message
     */
    fun updateMessage(message: String) {
        if (::mLoadingMessage.isInitialized) {
            mLoadingMessage.text = message
            mLoadingMessage.visibility = View.VISIBLE
        }
    }

    /**
     * Reset the timeout
     */
    fun resetTimeout() {
        cancelTimeoutHandler()
        startTimeoutHandler()
    }

    override fun onDestroyView() {
        cancelTimeoutHandler()
        super.onDestroyView()
    }
} 
package com.vega.tv.fragments

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.core.content.ContextCompat
import androidx.fragment.app.Fragment
import androidx.leanback.app.BrowseSupportFragment
import com.vega.tv.R
import com.vega.tv.utils.NetworkUtils

/**
 * ErrorFragment displays error messages in a TV-friendly format.
 * It provides options for retrying operations or dismissing the error.
 */
class ErrorFragment : Fragment() {

    private lateinit var mErrorMessage: TextView
    private lateinit var mErrorIcon: ImageView
    private lateinit var mRetryButton: Button
    private lateinit var mDismissButton: Button
    private var mRetryCallback: (() -> Unit)? = null
    private var mDismissCallback: (() -> Unit)? = null
    private var mErrorType: ErrorType = ErrorType.GENERIC

    companion object {
        private const val ARG_ERROR_MESSAGE = "error_message"
        private const val ARG_ERROR_TYPE = "error_type"

        /**
         * Creates a new instance of ErrorFragment
         */
        fun newInstance(
            message: String,
            errorType: ErrorType = ErrorType.GENERIC,
            retryCallback: (() -> Unit)? = null,
            dismissCallback: (() -> Unit)? = null
        ): ErrorFragment {
            return ErrorFragment().apply {
                arguments = Bundle().apply {
                    putString(ARG_ERROR_MESSAGE, message)
                    putSerializable(ARG_ERROR_TYPE, errorType)
                }
                mRetryCallback = retryCallback
                mDismissCallback = dismissCallback
            }
        }
    }

    enum class ErrorType {
        NETWORK,
        CONTENT_UNAVAILABLE,
        PLAYBACK_ERROR,
        GENERIC
    }

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        return inflater.inflate(R.layout.fragment_error, container, false)
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        // Initialize views
        mErrorMessage = view.findViewById(R.id.error_message)
        mErrorIcon = view.findViewById(R.id.error_icon)
        mRetryButton = view.findViewById(R.id.retry_button)
        mDismissButton = view.findViewById(R.id.dismiss_button)

        // Get arguments
        val message = arguments?.getString(ARG_ERROR_MESSAGE) ?: getString(R.string.error_generic)
        mErrorType = arguments?.getSerializable(ARG_ERROR_TYPE) as? ErrorType ?: ErrorType.GENERIC

        // Set error message
        mErrorMessage.text = message

        // Set error icon based on error type
        setErrorIcon()

        // Set up retry button
        mRetryButton.apply {
            setOnClickListener {
                if (mErrorType == ErrorType.NETWORK && !NetworkUtils.isNetworkAvailable(requireContext())) {
                    // Still no network, show toast
                    NetworkUtils.showNetworkUnavailableMessage(requireContext())
                } else {
                    mRetryCallback?.invoke()
                }
            }
            // Only show retry button if callback is provided
            visibility = if (mRetryCallback != null) View.VISIBLE else View.GONE
        }

        // Set up dismiss button
        mDismissButton.apply {
            setOnClickListener {
                mDismissCallback?.invoke() ?: run {
                    // Default behavior: remove this fragment
                    parentFragmentManager.beginTransaction()
                        .remove(this@ErrorFragment)
                        .commit()
                }
            }
        }

        // Set focus on retry button if available, otherwise on dismiss
        if (mRetryButton.visibility == View.VISIBLE) {
            mRetryButton.requestFocus()
        } else {
            mDismissButton.requestFocus()
        }
    }

    /**
     * Set the error icon based on the error type
     */
    private fun setErrorIcon() {
        val iconResId = when (mErrorType) {
            ErrorType.NETWORK -> R.drawable.ic_network_error
            ErrorType.CONTENT_UNAVAILABLE -> R.drawable.ic_content_unavailable
            ErrorType.PLAYBACK_ERROR -> R.drawable.ic_playback_error
            ErrorType.GENERIC -> R.drawable.ic_error
        }

        // Set the icon
        mErrorIcon.setImageDrawable(ContextCompat.getDrawable(requireContext(), iconResId))
    }

    /**
     * Update the error message
     */
    fun updateErrorMessage(message: String) {
        if (::mErrorMessage.isInitialized) {
            mErrorMessage.text = message
        }
    }

    /**
     * Update the error type
     */
    fun updateErrorType(errorType: ErrorType) {
        mErrorType = errorType
        if (::mErrorIcon.isInitialized) {
            setErrorIcon()
        }
    }

    /**
     * Set the retry callback
     */
    fun setRetryCallback(callback: (() -> Unit)?) {
        mRetryCallback = callback
        if (::mRetryButton.isInitialized) {
            mRetryButton.visibility = if (callback != null) View.VISIBLE else View.GONE
        }
    }

    /**
     * Set the dismiss callback
     */
    fun setDismissCallback(callback: (() -> Unit)?) {
        mDismissCallback = callback
    }
} 
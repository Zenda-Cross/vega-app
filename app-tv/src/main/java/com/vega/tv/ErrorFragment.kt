package com.vega.tv

import android.os.Bundle
import android.view.View
import androidx.core.content.ContextCompat
import androidx.leanback.app.ErrorSupportFragment
import com.vega.tv.R

/**
 * This class provides an error screen for the TV app.
 * It displays an error message and provides options to retry or go back.
 */
class ErrorFragment : ErrorSupportFragment() {

    private var mErrorMessage: String? = null
    private var mRetryCallback: (() -> Unit)? = null

    companion object {
        private const val DEFAULT_ERROR_MESSAGE = "An unexpected error occurred"

        fun newInstance(message: String?, retryCallback: (() -> Unit)? = null): ErrorFragment {
            val fragment = ErrorFragment()
            fragment.mErrorMessage = message ?: DEFAULT_ERROR_MESSAGE
            fragment.mRetryCallback = retryCallback
            return fragment
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Set the drawable for the error image
        imageDrawable = ContextCompat.getDrawable(requireContext(), R.drawable.lb_ic_sad_cloud)
        
        // Set the error message
        message = mErrorMessage ?: DEFAULT_ERROR_MESSAGE
        
        // Set the button text and action
        setButtonText(getString(R.string.error_retry))
        setButtonClickListener {
            mRetryCallback?.invoke() ?: requireActivity().finish()
        }
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // If no retry callback is provided, hide the button
        if (mRetryCallback == null) {
            buttonText = null
        }
    }
} 
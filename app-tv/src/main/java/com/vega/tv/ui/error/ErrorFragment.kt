package com.vega.tv.ui.error

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.ImageView
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.vega.tv.R

/**
 * Fragment for displaying error states in the TV app.
 * Provides customizable error messages, icons, and retry functionality.
 */
class ErrorFragment : Fragment() {

    companion object {
        private const val ARG_ERROR_TYPE = "error_type"
        private const val ARG_ERROR_MESSAGE = "error_message"
        private const val ARG_ERROR_TITLE = "error_title"

        const val ERROR_TYPE_GENERIC = 0
        const val ERROR_TYPE_NETWORK = 1
        const val ERROR_TYPE_CONTENT = 2
        const val ERROR_TYPE_PLAYBACK = 3

        /**
         * Creates a new instance of ErrorFragment with specified error details.
         *
         * @param errorType The type of error (network, content, etc.)
         * @param errorTitle Optional custom error title
         * @param errorMessage Optional custom error message
         * @return A new instance of ErrorFragment
         */
        fun newInstance(
            errorType: Int = ERROR_TYPE_GENERIC,
            errorTitle: String? = null,
            errorMessage: String? = null
        ): ErrorFragment {
            return ErrorFragment().apply {
                arguments = Bundle().apply {
                    putInt(ARG_ERROR_TYPE, errorType)
                    errorTitle?.let { putString(ARG_ERROR_TITLE, it) }
                    errorMessage?.let { putString(ARG_ERROR_MESSAGE, it) }
                }
            }
        }
    }

    private var errorType: Int = ERROR_TYPE_GENERIC
    private var errorTitle: String? = null
    private var errorMessage: String? = null
    private var retryListener: (() -> Unit)? = null
    
    private lateinit var errorIconView: ImageView
    private lateinit var errorTitleView: TextView
    private lateinit var errorMessageView: TextView
    private lateinit var retryButton: Button

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            errorType = it.getInt(ARG_ERROR_TYPE, ERROR_TYPE_GENERIC)
            errorTitle = it.getString(ARG_ERROR_TITLE)
            errorMessage = it.getString(ARG_ERROR_MESSAGE)
        }
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
        
        errorIconView = view.findViewById(R.id.error_icon)
        errorTitleView = view.findViewById(R.id.error_title)
        errorMessageView = view.findViewById(R.id.error_message)
        retryButton = view.findViewById(R.id.retry_button)
        
        setupErrorDisplay()
        setupRetryButton()
    }

    /**
     * Sets up the error display based on the error type and custom messages.
     */
    private fun setupErrorDisplay() {
        // Set error icon based on error type
        val iconResId = when (errorType) {
            ERROR_TYPE_NETWORK -> R.drawable.ic_network_error
            ERROR_TYPE_CONTENT -> R.drawable.ic_content_unavailable
            ERROR_TYPE_PLAYBACK -> R.drawable.ic_playback_error
            else -> R.drawable.ic_error
        }
        errorIconView.setImageResource(iconResId)
        
        // Set error title
        val titleResId = when (errorType) {
            ERROR_TYPE_NETWORK -> R.string.error_network_title
            ERROR_TYPE_CONTENT -> R.string.error_content_title
            ERROR_TYPE_PLAYBACK -> R.string.error_playback_title
            else -> R.string.error_title
        }
        errorTitleView.text = errorTitle ?: getString(titleResId)
        
        // Set error message
        val messageResId = when (errorType) {
            ERROR_TYPE_NETWORK -> R.string.error_network_message
            ERROR_TYPE_CONTENT -> R.string.error_content_message
            ERROR_TYPE_PLAYBACK -> R.string.error_playback_message
            else -> R.string.error_message
        }
        errorMessageView.text = errorMessage ?: getString(messageResId)
    }

    /**
     * Sets up the retry button click listener.
     */
    private fun setupRetryButton() {
        retryButton.requestFocus()
        retryButton.setOnClickListener {
            retryListener?.invoke()
        }
    }

    /**
     * Sets a listener for retry button clicks.
     *
     * @param listener The callback to invoke when retry is clicked
     */
    fun setRetryListener(listener: () -> Unit) {
        retryListener = listener
    }
} 
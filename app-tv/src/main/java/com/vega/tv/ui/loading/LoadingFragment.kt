package com.vega.tv.ui.loading

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import com.vega.tv.R

/**
 * Fragment for displaying loading states in the TV app.
 * Provides a customizable loading message with a progress indicator.
 */
class LoadingFragment : Fragment() {

    companion object {
        private const val ARG_LOADING_MESSAGE = "loading_message"

        /**
         * Creates a new instance of LoadingFragment with an optional custom message.
         *
         * @param message Optional custom loading message
         * @return A new instance of LoadingFragment
         */
        fun newInstance(message: String? = null): LoadingFragment {
            return LoadingFragment().apply {
                arguments = Bundle().apply {
                    message?.let { putString(ARG_LOADING_MESSAGE, it) }
                }
            }
        }
    }

    private var loadingMessage: String? = null
    private lateinit var loadingMessageView: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        arguments?.let {
            loadingMessage = it.getString(ARG_LOADING_MESSAGE)
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
        
        loadingMessageView = view.findViewById(R.id.loading_message)
        
        // Set custom loading message if provided
        loadingMessage?.let {
            loadingMessageView.text = it
        }
    }

    /**
     * Updates the loading message text.
     *
     * @param message The new message to display
     */
    fun updateMessage(message: String) {
        loadingMessage = message
        if (::loadingMessageView.isInitialized) {
            loadingMessageView.text = message
        }
    }
} 
package com.vega.tv.ui.common

import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.Fragment
import com.vega.tv.utils.FocusHelper
import com.vega.tv.utils.RemoteControlHandler
import com.vega.tv.utils.VoiceCommandHandler

/**
 * Base fragment for TV screens that handles common focus-related tasks.
 * Provides focus restoration, D-pad navigation enhancements, and other TV-specific functionality.
 */
abstract class BaseTvFragment : Fragment() {
    
    private var lastFocusedViewId = View.NO_ID
    private var rootView: ViewGroup? = null
    protected val remoteControlHandler: RemoteControlHandler?
        get() = (activity as? BaseTvActivity)?.remoteControlHandler
    protected val voiceCommandHandler: VoiceCommandHandler?
        get() = (activity as? BaseTvActivity)?.voiceCommandHandler
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Restore last focused view ID if available
        if (savedInstanceState != null) {
            lastFocusedViewId = savedInstanceState.getInt(KEY_LAST_FOCUSED_VIEW_ID, View.NO_ID)
        }
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Store the root view for later use
        rootView = view as? ViewGroup
        
        // Set up focus animations for all focusable views
        if (rootView != null) {
            FocusHelper.setupFocusAnimationForChildren(rootView!!)
        }
        
        // Set up key event handling
        view.setOnKeyListener { v, keyCode, event ->
            // Store the ID of the currently focused view
            if (event.action == KeyEvent.ACTION_DOWN) {
                val currentFocus = v.findFocus()
                if (currentFocus != null && currentFocus.id != View.NO_ID) {
                    lastFocusedViewId = currentFocus.id
                }
                
                // Let the remote control handler handle the event first
                if (remoteControlHandler?.handleKeyEvent(keyCode, event) == true) {
                    return@setOnKeyListener true
                }
                
                // Handle back button
                if (keyCode == KeyEvent.KEYCODE_BACK) {
                    return@setOnKeyListener onBackPressed()
                }
            }
            
            false
        }
    }
    
    override fun onResume() {
        super.onResume()
        
        // Restore focus to the last focused view
        if (lastFocusedViewId != View.NO_ID && rootView != null) {
            FocusHelper.restoreFocus(rootView!!, lastFocusedViewId)
        } else {
            // If no last focused view, focus the default view
            focusDefaultView()
        }
    }
    
    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        
        // Save the ID of the currently focused view
        if (lastFocusedViewId != View.NO_ID) {
            outState.putInt(KEY_LAST_FOCUSED_VIEW_ID, lastFocusedViewId)
        }
    }
    
    /**
     * Sets the default view to focus when the fragment is first displayed.
     * Override this method to specify the default focus view.
     *
     * @return true if a default view was focused, false otherwise
     */
    protected open fun focusDefaultView(): Boolean {
        return false
    }
    
    /**
     * Sets the default view to focus when the fragment is first displayed.
     *
     * @param viewId The ID of the view to focus by default
     * @return true if the view was focused, false otherwise
     */
    protected fun setDefaultFocusView(viewId: Int): Boolean {
        val view = view?.findViewById<View>(viewId)
        if (view != null && view.isFocusable && view.visibility == View.VISIBLE) {
            return view.requestFocus()
        }
        return false
    }
    
    /**
     * Handles custom focus traversal for a view.
     * Use this method to implement custom focus movement between views.
     *
     * @param view The view handling the key event
     * @param event The key event
     * @param upViewId The ID of the view to focus when navigating up (optional)
     * @param downViewId The ID of the view to focus when navigating down (optional)
     * @param leftViewId The ID of the view to focus when navigating left (optional)
     * @param rightViewId The ID of the view to focus when navigating right (optional)
     * @return true if the event was handled, false otherwise
     */
    protected fun handleFocusKeyEvent(
        view: View,
        event: KeyEvent,
        upViewId: Int = View.NO_ID,
        downViewId: Int = View.NO_ID,
        leftViewId: Int = View.NO_ID,
        rightViewId: Int = View.NO_ID
    ): Boolean {
        if (event.action != KeyEvent.ACTION_DOWN) {
            return false
        }
        
        val rootView = this.rootView ?: return false
        
        val upView = if (upViewId != View.NO_ID) rootView.findViewById<View>(upViewId) else null
        val downView = if (downViewId != View.NO_ID) rootView.findViewById<View>(downViewId) else null
        val leftView = if (leftViewId != View.NO_ID) rootView.findViewById<View>(leftViewId) else null
        val rightView = if (rightViewId != View.NO_ID) rootView.findViewById<View>(rightViewId) else null
        
        return FocusHelper.handleKeyEvent(view, event, upView, downView, leftView, rightView)
    }
    
    /**
     * Handles the back button press.
     * Override this method to provide custom back button behavior.
     *
     * @return true if the back button press was handled, false otherwise
     */
    protected open fun onBackPressed(): Boolean {
        return false
    }
    
    /**
     * Registers a custom voice command handler.
     *
     * @param commandPattern The command pattern to match
     * @param handler The handler function
     */
    protected fun registerVoiceCommand(commandPattern: String, handler: (List<String>) -> Boolean) {
        voiceCommandHandler?.registerCommandHandler(commandPattern, handler)
    }
    
    /**
     * Registers a custom media key handler.
     *
     * @param handler The media key handler function
     */
    protected fun setMediaKeyHandler(handler: (Int) -> Boolean) {
        remoteControlHandler?.setOnMediaKeyListener(handler)
    }
    
    /**
     * Registers a custom gamepad key handler.
     *
     * @param handler The gamepad key handler function
     */
    protected fun setGamepadKeyHandler(handler: (Int) -> Boolean) {
        remoteControlHandler?.setOnGamepadKeyListener(handler)
    }
    
    companion object {
        private const val KEY_LAST_FOCUSED_VIEW_ID = "last_focused_view_id"
    }
} 
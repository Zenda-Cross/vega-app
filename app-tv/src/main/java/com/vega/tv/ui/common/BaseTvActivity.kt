package com.vega.tv.ui.common

import android.content.Intent
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import androidx.fragment.app.FragmentActivity
import com.vega.tv.utils.FocusHelper
import com.vega.tv.utils.RemoteControlHandler
import com.vega.tv.utils.VoiceCommandHandler

/**
 * Base activity for TV screens that handles common focus-related tasks.
 * Provides focus restoration, D-pad navigation enhancements, and other TV-specific functionality.
 */
abstract class BaseTvActivity : FragmentActivity() {
    
    private var lastFocusedViewId = View.NO_ID
    protected lateinit var remoteControlHandler: RemoteControlHandler
    protected lateinit var voiceCommandHandler: VoiceCommandHandler
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Restore last focused view ID if available
        if (savedInstanceState != null) {
            lastFocusedViewId = savedInstanceState.getInt(KEY_LAST_FOCUSED_VIEW_ID, View.NO_ID)
        }
        
        // Initialize remote control handler
        remoteControlHandler = RemoteControlHandler(this)
        
        // Initialize voice command handler
        voiceCommandHandler = VoiceCommandHandler.createWithCommonCommands(this)
        voiceCommandHandler.setRemoteControlHandler(remoteControlHandler)
        
        // Set up back button handling
        remoteControlHandler.setOnBackPressedListener {
            onBackPressed()
            true
        }
    }
    
    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        
        // Save the ID of the currently focused view
        val currentFocus = currentFocus
        if (currentFocus != null && currentFocus.id != View.NO_ID) {
            outState.putInt(KEY_LAST_FOCUSED_VIEW_ID, currentFocus.id)
        }
    }
    
    override fun onResume() {
        super.onResume()
        
        // Restore focus to the last focused view
        if (lastFocusedViewId != View.NO_ID) {
            val rootView = findViewById<ViewGroup>(android.R.id.content)
            FocusHelper.restoreFocus(rootView, lastFocusedViewId)
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        
        // Release resources
        remoteControlHandler.release()
    }
    
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        // Store the ID of the currently focused view
        val currentFocus = currentFocus
        if (currentFocus != null && currentFocus.id != View.NO_ID) {
            lastFocusedViewId = currentFocus.id
        }
        
        // Let the remote control handler handle the event first
        if (remoteControlHandler.handleKeyEvent(event.keyCode, event)) {
            return true
        }
        
        return super.dispatchKeyEvent(event)
    }
    
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        
        // Handle search intents and voice commands
        if (voiceCommandHandler.handleSearchIntent(this, intent)) {
            return
        }
    }
    
    /**
     * Sets up focus animations for all focusable views in the activity.
     * Call this method after setting the content view.
     */
    protected fun setupFocusAnimations() {
        val rootView = findViewById<ViewGroup>(android.R.id.content)
        FocusHelper.setupFocusAnimationForChildren(rootView)
    }
    
    /**
     * Sets the default view to focus when the activity is first displayed.
     * Call this method after setting the content view.
     *
     * @param viewId The ID of the view to focus by default
     */
    protected fun setDefaultFocusView(viewId: Int) {
        val view = findViewById<View>(viewId)
        if (view != null && view.isFocusable && view.visibility == View.VISIBLE) {
            view.requestFocus()
        }
    }
    
    /**
     * Handles the back button press.
     * Override this method to provide custom back button behavior.
     *
     * @return true if the back button press was handled, false otherwise
     */
    protected open fun onBackPressed(): Boolean {
        // Default implementation finishes the activity
        finish()
        return true
    }
    
    /**
     * Registers a custom voice command handler.
     *
     * @param commandPattern The command pattern to match
     * @param handler The handler function
     */
    protected fun registerVoiceCommand(commandPattern: String, handler: (List<String>) -> Boolean) {
        voiceCommandHandler.registerCommandHandler(commandPattern, handler)
    }
    
    /**
     * Registers a custom media key handler.
     *
     * @param handler The media key handler function
     */
    protected fun setMediaKeyHandler(handler: (Int) -> Boolean) {
        remoteControlHandler.setOnMediaKeyListener(handler)
    }
    
    /**
     * Registers a custom gamepad key handler.
     *
     * @param handler The gamepad key handler function
     */
    protected fun setGamepadKeyHandler(handler: (Int) -> Boolean) {
        remoteControlHandler.setOnGamepadKeyListener(handler)
    }
    
    companion object {
        private const val KEY_LAST_FOCUSED_VIEW_ID = "last_focused_view_id"
    }
} 
package com.vega.tv.utils

import android.app.Activity
import android.content.Context
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.view.InputDevice
import android.view.KeyEvent
import android.view.View
import androidx.fragment.app.FragmentActivity
import com.google.android.exoplayer2.Player
import com.google.android.exoplayer2.ui.StyledPlayerView

/**
 * Utility class for handling remote control input, media keys, and game controller input.
 * Provides a unified interface for handling various input methods in Android TV.
 */
class RemoteControlHandler(private val context: Context) {

    private var mediaSession: MediaSession? = null
    private var player: Player? = null
    private var playerView: StyledPlayerView? = null
    private var onBackPressedListener: (() -> Boolean)? = null
    private var onMediaKeyListener: ((Int) -> Boolean)? = null
    private var onGamepadKeyListener: ((Int) -> Boolean)? = null
    private var onVoiceCommandListener: ((String) -> Boolean)? = null
    
    // Mapping of key codes to actions
    private val mediaKeyMap = mapOf(
        KeyEvent.KEYCODE_MEDIA_PLAY to MediaAction.PLAY,
        KeyEvent.KEYCODE_MEDIA_PAUSE to MediaAction.PAUSE,
        KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE to MediaAction.PLAY_PAUSE,
        KeyEvent.KEYCODE_MEDIA_STOP to MediaAction.STOP,
        KeyEvent.KEYCODE_MEDIA_NEXT to MediaAction.NEXT,
        KeyEvent.KEYCODE_MEDIA_PREVIOUS to MediaAction.PREVIOUS,
        KeyEvent.KEYCODE_MEDIA_REWIND to MediaAction.REWIND,
        KeyEvent.KEYCODE_MEDIA_FAST_FORWARD to MediaAction.FAST_FORWARD
    )
    
    // Mapping of gamepad buttons to actions
    private val gamepadKeyMap = mapOf(
        KeyEvent.KEYCODE_BUTTON_A to GamepadAction.A,
        KeyEvent.KEYCODE_BUTTON_B to GamepadAction.B,
        KeyEvent.KEYCODE_BUTTON_X to GamepadAction.X,
        KeyEvent.KEYCODE_BUTTON_Y to GamepadAction.Y,
        KeyEvent.KEYCODE_BUTTON_L1 to GamepadAction.L1,
        KeyEvent.KEYCODE_BUTTON_R1 to GamepadAction.R1,
        KeyEvent.KEYCODE_BUTTON_START to GamepadAction.START,
        KeyEvent.KEYCODE_BUTTON_SELECT to GamepadAction.SELECT
    )

    /**
     * Sets up media session for handling media keys.
     *
     * @param activity The activity that will handle media keys
     * @param player The ExoPlayer instance to control
     */
    fun setupMediaSession(activity: FragmentActivity, player: Player) {
        this.player = player
        
        // Create and configure media session
        mediaSession = MediaSession(context, "VegaTvMediaSession")
        mediaSession?.setCallback(createMediaSessionCallback())
        mediaSession?.isActive = true
        
        // Set up media session token for the player
        if (playerView != null) {
            playerView?.setMediaSessionToken(mediaSession?.sessionToken)
        }
        
        // Set up activity callbacks
        activity.addOnBackPressedCallback()
    }

    /**
     * Sets the player view for controlling playback.
     *
     * @param playerView The StyledPlayerView instance
     */
    fun setPlayerView(playerView: StyledPlayerView) {
        this.playerView = playerView
        
        // Set up media session token for the player if available
        mediaSession?.let {
            playerView.setMediaSessionToken(it.sessionToken)
        }
    }

    /**
     * Sets a listener for back button presses.
     *
     * @param listener The back pressed listener
     */
    fun setOnBackPressedListener(listener: () -> Boolean) {
        onBackPressedListener = listener
    }

    /**
     * Sets a listener for media key events.
     *
     * @param listener The media key listener
     */
    fun setOnMediaKeyListener(listener: (Int) -> Boolean) {
        onMediaKeyListener = listener
    }

    /**
     * Sets a listener for gamepad key events.
     *
     * @param listener The gamepad key listener
     */
    fun setOnGamepadKeyListener(listener: (Int) -> Boolean) {
        onGamepadKeyListener = listener
    }

    /**
     * Sets a listener for voice commands.
     *
     * @param listener The voice command listener
     */
    fun setOnVoiceCommandListener(listener: (String) -> Boolean) {
        onVoiceCommandListener = listener
    }

    /**
     * Handles key events from the remote control, media keys, or gamepad.
     *
     * @param keyCode The key code of the event
     * @param event The key event
     * @return true if the event was handled, false otherwise
     */
    fun handleKeyEvent(keyCode: Int, event: KeyEvent): Boolean {
        // Only handle key down events to avoid duplicate handling
        if (event.action != KeyEvent.ACTION_DOWN) {
            return false
        }
        
        // Check if this is a media key
        if (isMediaKey(keyCode)) {
            return handleMediaKey(keyCode)
        }
        
        // Check if this is a gamepad key
        if (isGamepadSource(event) && isGamepadKey(keyCode)) {
            return handleGamepadKey(keyCode)
        }
        
        // Handle back button
        if (keyCode == KeyEvent.KEYCODE_BACK) {
            return onBackPressedListener?.invoke() ?: false
        }
        
        // Handle other keys
        return when (keyCode) {
            KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER -> {
                // Default select action
                handleDefaultSelectAction()
                true
            }
            else -> false
        }
    }

    /**
     * Handles voice commands from the remote control.
     *
     * @param command The voice command
     * @return true if the command was handled, false otherwise
     */
    fun handleVoiceCommand(command: String): Boolean {
        // Try custom voice command handler first
        if (onVoiceCommandListener?.invoke(command) == true) {
            return true
        }
        
        // Handle common voice commands
        return when {
            command.contains("play", ignoreCase = true) -> {
                player?.play()
                true
            }
            command.contains("pause", ignoreCase = true) -> {
                player?.pause()
                true
            }
            command.contains("stop", ignoreCase = true) -> {
                player?.stop()
                true
            }
            command.contains("next", ignoreCase = true) -> {
                player?.next()
                true
            }
            command.contains("previous", ignoreCase = true) -> {
                player?.previous()
                true
            }
            command.contains("forward", ignoreCase = true) -> {
                player?.seekForward()
                true
            }
            command.contains("rewind", ignoreCase = true) -> {
                player?.seekBack()
                true
            }
            else -> false
        }
    }

    /**
     * Releases resources used by the handler.
     */
    fun release() {
        mediaSession?.release()
        mediaSession = null
        player = null
        playerView = null
    }

    /**
     * Creates a callback for the media session.
     *
     * @return The media session callback
     */
    private fun createMediaSessionCallback(): MediaSession.Callback {
        return object : MediaSession.Callback() {
            override fun onPlay() {
                player?.play()
            }

            override fun onPause() {
                player?.pause()
            }

            override fun onStop() {
                player?.stop()
            }

            override fun onSkipToNext() {
                player?.next()
            }

            override fun onSkipToPrevious() {
                player?.previous()
            }

            override fun onFastForward() {
                player?.seekForward()
            }

            override fun onRewind() {
                player?.seekBack()
            }

            override fun onSeekTo(pos: Long) {
                player?.seekTo(pos)
            }
        }
    }

    /**
     * Handles a media key event.
     *
     * @param keyCode The key code of the event
     * @return true if the event was handled, false otherwise
     */
    private fun handleMediaKey(keyCode: Int): Boolean {
        // Try custom media key handler first
        if (onMediaKeyListener?.invoke(keyCode) == true) {
            return true
        }
        
        // Handle media key based on mapping
        val action = mediaKeyMap[keyCode] ?: return false
        
        return when (action) {
            MediaAction.PLAY -> {
                player?.play()
                true
            }
            MediaAction.PAUSE -> {
                player?.pause()
                true
            }
            MediaAction.PLAY_PAUSE -> {
                if (player?.isPlaying == true) {
                    player?.pause()
                } else {
                    player?.play()
                }
                true
            }
            MediaAction.STOP -> {
                player?.stop()
                true
            }
            MediaAction.NEXT -> {
                player?.next()
                true
            }
            MediaAction.PREVIOUS -> {
                player?.previous()
                true
            }
            MediaAction.REWIND -> {
                player?.seekBack()
                true
            }
            MediaAction.FAST_FORWARD -> {
                player?.seekForward()
                true
            }
        }
    }

    /**
     * Handles a gamepad key event.
     *
     * @param keyCode The key code of the event
     * @return true if the event was handled, false otherwise
     */
    private fun handleGamepadKey(keyCode: Int): Boolean {
        // Try custom gamepad key handler first
        if (onGamepadKeyListener?.invoke(keyCode) == true) {
            return true
        }
        
        // Handle gamepad key based on mapping
        val action = gamepadKeyMap[keyCode] ?: return false
        
        return when (action) {
            GamepadAction.A -> {
                // A button typically acts as select/enter
                handleDefaultSelectAction()
                true
            }
            GamepadAction.B -> {
                // B button typically acts as back
                onBackPressedListener?.invoke() ?: false
            }
            GamepadAction.X -> {
                // X button for rewind
                player?.seekBack()
                true
            }
            GamepadAction.Y -> {
                // Y button for fast forward
                player?.seekForward()
                true
            }
            GamepadAction.L1 -> {
                // L1 button for previous
                player?.previous()
                true
            }
            GamepadAction.R1 -> {
                // R1 button for next
                player?.next()
                true
            }
            GamepadAction.START -> {
                // Start button for play/pause
                if (player?.isPlaying == true) {
                    player?.pause()
                } else {
                    player?.play()
                }
                true
            }
            GamepadAction.SELECT -> {
                // Select button for showing/hiding controls
                playerView?.showController()
                true
            }
        }
    }

    /**
     * Handles the default select action (e.g., when Enter or D-pad center is pressed).
     */
    private fun handleDefaultSelectAction() {
        // If player is available, toggle play/pause
        if (player != null) {
            if (player?.isPlaying == true) {
                player?.pause()
            } else {
                player?.play()
            }
        }
    }

    /**
     * Checks if a key code is a media key.
     *
     * @param keyCode The key code to check
     * @return true if the key code is a media key, false otherwise
     */
    private fun isMediaKey(keyCode: Int): Boolean {
        return mediaKeyMap.containsKey(keyCode)
    }

    /**
     * Checks if a key code is a gamepad key.
     *
     * @param keyCode The key code to check
     * @return true if the key code is a gamepad key, false otherwise
     */
    private fun isGamepadKey(keyCode: Int): Boolean {
        return gamepadKeyMap.containsKey(keyCode)
    }

    /**
     * Checks if an event comes from a gamepad source.
     *
     * @param event The key event to check
     * @return true if the event comes from a gamepad source, false otherwise
     */
    private fun isGamepadSource(event: KeyEvent): Boolean {
        val source = event.source
        return (source and InputDevice.SOURCE_GAMEPAD) == InputDevice.SOURCE_GAMEPAD ||
                (source and InputDevice.SOURCE_JOYSTICK) == InputDevice.SOURCE_JOYSTICK
    }

    /**
     * Adds a back pressed callback to the activity.
     */
    private fun FragmentActivity.addOnBackPressedCallback() {
        onBackPressedDispatcher.addCallback(this, androidx.activity.OnBackPressedCallback(true) {
            val handled = onBackPressedListener?.invoke() ?: false
            if (!handled) {
                // If not handled by the listener, finish the activity
                finish()
            }
        })
    }

    /**
     * Enum class for media actions.
     */
    enum class MediaAction {
        PLAY,
        PAUSE,
        PLAY_PAUSE,
        STOP,
        NEXT,
        PREVIOUS,
        REWIND,
        FAST_FORWARD
    }

    /**
     * Enum class for gamepad actions.
     */
    enum class GamepadAction {
        A,
        B,
        X,
        Y,
        L1,
        R1,
        START,
        SELECT
    }

    companion object {
        // Seek forward/backward amount in milliseconds
        private const val DEFAULT_SEEK_MS = 10000L
        
        /**
         * Extension function to seek forward.
         */
        private fun Player.seekForward() {
            val newPosition = currentPosition + DEFAULT_SEEK_MS
            seekTo(newPosition.coerceAtMost(duration))
        }
        
        /**
         * Extension function to seek backward.
         */
        private fun Player.seekBack() {
            val newPosition = currentPosition - DEFAULT_SEEK_MS
            seekTo(newPosition.coerceAtLeast(0))
        }
    }
} 
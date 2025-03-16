package com.vega.tv.ui.player

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.KeyEvent
import androidx.fragment.app.Fragment
import com.google.android.exoplayer2.ExoPlayer
import com.google.android.exoplayer2.Player
import com.google.android.exoplayer2.ui.StyledPlayerView
import com.vega.tv.R
import com.vega.tv.ui.common.BaseTvActivity
import com.vega.tv.utils.NetworkUtils
import java.io.IOException

/**
 * Sample implementation of a video player activity.
 * Demonstrates the usage of the state management system and remote control handling.
 */
class VideoPlayerActivity : BaseTvActivity() {

    companion object {
        private const val EXTRA_VIDEO_ID = "extra_video_id"
        private const val EXTRA_VIDEO_TITLE = "extra_video_title"
        
        // Key event shortcuts
        private const val SEEK_STEP_MS = 10000 // 10 seconds
        private const val LONG_SEEK_STEP_MS = 30000 // 30 seconds
        
        /**
         * Creates an intent to start this activity.
         *
         * @param context The context to use
         * @param videoId The ID of the video to play
         * @param videoTitle The title of the video
         * @return An intent to start this activity
         */
        fun createIntent(context: Context, videoId: String, videoTitle: String): Intent {
            return Intent(context, VideoPlayerActivity::class.java).apply {
                putExtra(EXTRA_VIDEO_ID, videoId)
                putExtra(EXTRA_VIDEO_TITLE, videoTitle)
            }
        }
    }
    
    private var videoId: String? = null
    private var videoTitle: String? = null
    private val handler = Handler(Looper.getMainLooper())
    private var player: ExoPlayer? = null
    private var playerView: StyledPlayerView? = null
    private var isControlsVisible = false
    
    override fun onCreate(savedInstanceState: Bundle?) {
        // Extract intent extras
        videoId = intent.getStringExtra(EXTRA_VIDEO_ID)
        videoTitle = intent.getStringExtra(EXTRA_VIDEO_TITLE)
        
        // Validate required parameters
        if (videoId.isNullOrEmpty()) {
            finish()
            return
        }
        
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_player)
        
        // Initialize player view
        playerView = findViewById(R.id.player_view)
        
        // Set up focus animations
        setupFocusAnimations()
        
        // Register voice commands
        setupVoiceCommands()
    }
    
    override fun onStart() {
        super.onStart()
        
        // Initialize player
        setupPlayer()
    }
    
    override fun onStop() {
        super.onStop()
        
        // Release player
        releasePlayer()
    }
    
    override fun onBackPressed(): Boolean {
        // If controls are visible, hide them instead of exiting
        if (isControlsVisible) {
            playerView?.hideController()
            isControlsVisible = false
            return true
        }
        
        // Otherwise, finish the activity
        return super.onBackPressed()
    }
    
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        // Handle media control keys
        if (event.action == KeyEvent.ACTION_DOWN) {
            when (event.keyCode) {
                // Custom handling for specific keys
                KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER -> {
                    togglePlayPause()
                    return true
                }
                KeyEvent.KEYCODE_DPAD_LEFT -> {
                    if (event.isLongPress) {
                        seekBackward(LONG_SEEK_STEP_MS)
                    } else {
                        seekBackward(SEEK_STEP_MS)
                    }
                    return true
                }
                KeyEvent.KEYCODE_DPAD_RIGHT -> {
                    if (event.isLongPress) {
                        seekForward(LONG_SEEK_STEP_MS)
                    } else {
                        seekForward(SEEK_STEP_MS)
                    }
                    return true
                }
                KeyEvent.KEYCODE_DPAD_UP -> {
                    // Show controls when navigating up
                    showControls()
                    return false // Let the system handle focus navigation
                }
                KeyEvent.KEYCODE_DPAD_DOWN -> {
                    // Show controls when navigating down
                    showControls()
                    return false // Let the system handle focus navigation
                }
                KeyEvent.KEYCODE_MENU -> {
                    // Toggle controls visibility
                    toggleControls()
                    return true
                }
            }
        }
        
        // Let the parent handle other keys
        return super.dispatchKeyEvent(event)
    }
    
    private fun setupPlayer() {
        // Create ExoPlayer instance
        player = ExoPlayer.Builder(this).build()
        
        // Set up player view
        playerView?.player = player
        
        // Set up media session for handling media keys
        remoteControlHandler.setupMediaSession(this, player!!)
        remoteControlHandler.setPlayerView(playerView!!)
        
        // Set up custom media key handlers
        setupMediaKeyHandlers()
        
        // Set up custom gamepad handlers
        setupGamepadHandlers()
        
        // Show loading state
        showLoading(getString(R.string.loading_video))
        
        // Simulate loading delay
        handler.postDelayed({
            // Check network connectivity
            if (!NetworkUtils.isNetworkAvailable(this)) {
                // Show network error
                val networkError = IOException("No network connection")
                handlePlayerError(networkError)
                return@postDelayed
            }
            
            // Simulate successful video loading
            loadVideo()
        }, 1500)
    }
    
    private fun loadVideo() {
        // In a real implementation, this would load the actual video
        // For this example, we'll just show a placeholder
        
        // Hide loading
        hideLoading()
        
        // Start playback
        player?.play()
    }
    
    private fun releasePlayer() {
        player?.release()
        player = null
    }
    
    private fun setupMediaKeyHandlers() {
        // Set up custom media key handlers
        setMediaKeyHandler { keyCode ->
            // Handle custom media key behavior here
            false // Return false to let the default handler handle it
        }
    }
    
    private fun setupGamepadHandlers() {
        // Set up custom gamepad handlers
        setGamepadKeyHandler { keyCode ->
            // Handle custom gamepad behavior here
            false // Return false to let the default handler handle it
        }
    }
    
    private fun setupVoiceCommands() {
        // Register custom voice commands
        registerVoiceCommand("jump to", { params ->
            if (params.isNotEmpty()) {
                try {
                    // Try to parse time in minutes or seconds
                    val timeText = params[0]
                    val minutes = parseTimeFromVoiceCommand(timeText)
                    if (minutes >= 0) {
                        seekToPosition(minutes * 60 * 1000)
                        return@registerVoiceCommand true
                    }
                } catch (e: NumberFormatException) {
                    // Ignore parsing errors
                }
            }
            false
        })
        
        registerVoiceCommand("seek to", { params ->
            if (params.isNotEmpty()) {
                try {
                    // Try to parse time in minutes or seconds
                    val timeText = params[0]
                    val minutes = parseTimeFromVoiceCommand(timeText)
                    if (minutes >= 0) {
                        seekToPosition(minutes * 60 * 1000)
                        return@registerVoiceCommand true
                    }
                } catch (e: NumberFormatException) {
                    // Ignore parsing errors
                }
            }
            false
        })
        
        registerVoiceCommand("volume up", { _ ->
            // Increase volume
            // This would need to be implemented based on your audio handling
            true
        })
        
        registerVoiceCommand("volume down", { _ ->
            // Decrease volume
            // This would need to be implemented based on your audio handling
            true
        })
        
        registerVoiceCommand("mute", { _ ->
            // Mute audio
            player?.volume = 0f
            true
        })
        
        registerVoiceCommand("unmute", { _ ->
            // Unmute audio
            player?.volume = 1f
            true
        })
    }
    
    private fun parseTimeFromVoiceCommand(timeText: String): Int {
        // Try to parse time in various formats
        val minutesPattern = Regex("(\\d+)\\s*(?:minute|minutes|min|mins)")
        val secondsPattern = Regex("(\\d+)\\s*(?:second|seconds|sec|secs)")
        
        val minutesMatch = minutesPattern.find(timeText)
        if (minutesMatch != null) {
            return minutesMatch.groupValues[1].toInt()
        }
        
        val secondsMatch = secondsPattern.find(timeText)
        if (secondsMatch != null) {
            return secondsMatch.groupValues[1].toInt() / 60
        }
        
        // Try to parse as a simple number (assume minutes)
        val numberPattern = Regex("(\\d+)")
        val numberMatch = numberPattern.find(timeText)
        if (numberMatch != null) {
            return numberMatch.groupValues[1].toInt()
        }
        
        return -1
    }
    
    private fun togglePlayPause() {
        player?.let {
            if (it.isPlaying) {
                it.pause()
            } else {
                it.play()
            }
        }
    }
    
    private fun seekForward(timeMs: Long) {
        player?.let {
            val newPosition = it.currentPosition + timeMs
            it.seekTo(newPosition.coerceAtMost(it.duration))
        }
    }
    
    private fun seekBackward(timeMs: Long) {
        player?.let {
            val newPosition = it.currentPosition - timeMs
            it.seekTo(newPosition.coerceAtLeast(0))
        }
    }
    
    private fun seekToPosition(positionMs: Long) {
        player?.seekTo(positionMs)
    }
    
    private fun showControls() {
        playerView?.showController()
        isControlsVisible = true
    }
    
    private fun hideControls() {
        playerView?.hideController()
        isControlsVisible = false
    }
    
    private fun toggleControls() {
        if (isControlsVisible) {
            hideControls()
        } else {
            showControls()
        }
    }
    
    private fun showLoading(message: String? = null) {
        // In a real implementation, this would show a loading indicator
    }
    
    private fun hideLoading() {
        // In a real implementation, this would hide the loading indicator
    }
    
    private fun handlePlayerError(error: Throwable) {
        // In a real implementation, this would show an error message
    }
} 
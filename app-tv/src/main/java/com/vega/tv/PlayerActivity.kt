package com.vega.tv

import android.app.PictureInPictureParams
import android.content.Intent
import android.content.res.Configuration
import android.os.Build
import android.os.Bundle
import android.util.Rational
import android.util.Log
import android.view.KeyEvent
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.leanback.media.PlaybackTransportControlGlue
import androidx.leanback.widget.PlaybackControlsRow
import com.google.android.exoplayer2.ExoPlayer
import com.google.android.exoplayer2.MediaItem
import com.google.android.exoplayer2.Player
import com.google.android.exoplayer2.ext.leanback.LeanbackPlayerAdapter
import com.google.android.exoplayer2.ui.StyledPlayerView
import com.vega.shared.models.Stream
import com.vega.shared.models.MediaContent
import com.vega.shared.repositories.ContentRepository
import com.vega.tv.utils.TvPreferences

/**
 * Activity for playing media content on TV
 */
class PlayerActivity : AppCompatActivity() {
    
    private val TAG = "PlayerActivity"
    
    private lateinit var playerView: StyledPlayerView
    private lateinit var player: ExoPlayer
    private lateinit var playerAdapter: LeanbackPlayerAdapter
    private lateinit var transportControlGlue: PlaybackTransportControlGlue<LeanbackPlayerAdapter>
    
    private var streamUrl: String? = null
    private var title: String? = null
    private var subtitle: String? = null
    private var position: Long = 0
    
    private lateinit var mContentRepository: ContentRepository
    private lateinit var mPreferences: TvPreferences
    private var mMediaContent: MediaContent? = null
    private var mMediaContentId: String? = null
    private var mStartPosition: Long = 0
    private var mIsTrailer: Boolean = false
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_player)
        
        // Get intent data
        streamUrl = intent.getStringExtra(EXTRA_STREAM_URL)
        title = intent.getStringExtra(EXTRA_TITLE)
        subtitle = intent.getStringExtra(EXTRA_SUBTITLE)
        position = intent.getLongExtra(EXTRA_POSITION, 0)
        
        // Get the repositories
        mContentRepository = MainApplication.from(this).contentRepository
        mPreferences = MainApplication.from(this).preferences
        
        // Get the media content ID from the intent
        mMediaContentId = intent.getStringExtra(MEDIA_CONTENT_ID)
        mStartPosition = intent.getLongExtra(START_POSITION, 0)
        mIsTrailer = intent.getBooleanExtra(IS_TRAILER, false)
        
        if (mMediaContentId == null) {
            finish()
            return
        }
        
        // Initialize player
        loadMediaContent()
    }
    
    private fun loadMediaContent() {
        // Show loading indicator
        progressBar.visibility = View.VISIBLE
        
        // Load content from repository
        lifecycleScope.launch {
            try {
                val content = mContentRepository.getContentById(mMediaContentId ?: "")
                
                if (content != null) {
                    mMediaContent = content
                    
                    // Get the last watched position if not specified
                    if (mStartPosition == 0L) {
                        mStartPosition = mPreferences.getLastWatchedPosition(content.id)
                    }
                    
                    // Initialize the player with the content
                    initializePlayer(content)
                } else {
                    // Show error if content not found
                    showError(getString(R.string.error_loading_content))
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error loading content", e)
                showError(getString(R.string.error_loading_content))
            } finally {
                progressBar.visibility = View.GONE
            }
        }
    }
    
    private fun initializePlayer(content: MediaContent) {
        // Create a media item from the content
        val mediaItem = MediaItem.Builder()
            .setUri(content.videoUrl)
            .setMediaId(content.id)
            .build()
        
        // Initialize the player
        player = ExoPlayer.Builder(this)
            .build()
            .also { exoPlayer ->
                playerView.player = exoPlayer
                
                // Set media item
                exoPlayer.setMediaItem(mediaItem)
                
                // Prepare the player
                exoPlayer.prepare()
                
                // Set the playback position
                if (mStartPosition > 0) {
                    exoPlayer.seekTo(mStartPosition)
                }
                
                // Start playing
                exoPlayer.play()
            }
        
        // Set up leanback player adapter
        playerAdapter = LeanbackPlayerAdapter(this, player, 16)
        
        // Set up transport control glue
        transportControlGlue = PlaybackTransportControlGlue(this, playerAdapter)
        transportControlGlue.title = title
        transportControlGlue.subtitle = subtitle
        
        // Add playback state listeners
        player.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(state: Int) {
                if (state == Player.STATE_ENDED) {
                    finish()
                }
            }
        })
    }
    
    override fun onStart() {
        super.onStart()
        if (Build.VERSION.SDK_INT > 23) {
            initializePlayer()
        }
    }
    
    override fun onResume() {
        super.onResume()
        if (Build.VERSION.SDK_INT <= 23) {
            initializePlayer()
        }
        hideSystemUI()
    }
    
    override fun onPause() {
        super.onPause()
        if (Build.VERSION.SDK_INT <= 23) {
            releasePlayer()
        }
        // Save the current playback position
        savePlaybackPosition()
    }
    
    override fun onStop() {
        super.onStop()
        if (Build.VERSION.SDK_INT > 23) {
            releasePlayer()
        }
    }
    
    private fun releasePlayer() {
        if (::player.isInitialized) {
            position = player.currentPosition
            player.release()
        }
    }
    
    private fun hideSystemUI() {
        playerView.systemUiVisibility = (View.SYSTEM_UI_FLAG_LOW_PROFILE
                or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION)
    }
    
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        // Handle media keys
        when (keyCode) {
            KeyEvent.KEYCODE_MEDIA_PLAY -> {
                player.play()
                return true
            }
            KeyEvent.KEYCODE_MEDIA_PAUSE -> {
                player.pause()
                return true
            }
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> {
                if (player.isPlaying) player.pause() else player.play()
                return true
            }
            KeyEvent.KEYCODE_MEDIA_FAST_FORWARD -> {
                player.seekTo(player.currentPosition + 10000) // 10 seconds forward
                return true
            }
            KeyEvent.KEYCODE_MEDIA_REWIND -> {
                player.seekTo(player.currentPosition - 10000) // 10 seconds backward
                return true
            }
            KeyEvent.KEYCODE_BACK -> {
                finish()
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }
    
    override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
        if (isInPictureInPictureMode) {
            // Hide controls in PiP mode
            playerView.useController = false
        } else {
            // Show controls when not in PiP mode
            playerView.useController = true
        }
    }
    
    override fun onUserLeaveHint() {
        // Enter Picture-in-Picture mode when the user leaves the app
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val params = PictureInPictureParams.Builder()
                .setAspectRatio(Rational(16, 9))
                .build()
            enterPictureInPictureMode(params)
        }
    }
    
    private fun savePlaybackPosition() {
        mMediaContentId?.let { contentId ->
            // Save the current position to preferences
            player?.let { exoPlayer ->
                if (exoPlayer.isPlaying || exoPlayer.currentPosition > 0) {
                    val currentPosition = exoPlayer.currentPosition
                    mPreferences.saveLastWatchedPosition(contentId, currentPosition)
                    
                    // Add to continue watching if we've watched at least 30 seconds
                    if (currentPosition > 30000) {
                        mPreferences.addToContinueWatching(contentId)
                    }
                    
                    Log.d(TAG, "Saved playback position: $currentPosition for content: $contentId")
                }
            }
        }
    }
    
    private fun showError(message: String) {
        Toast.makeText(this, message, Toast.LENGTH_LONG).show()
        finish()
    }
    
    companion object {
        private const val EXTRA_STREAM_URL = "extra_stream_url"
        private const val EXTRA_TITLE = "extra_title"
        private const val EXTRA_SUBTITLE = "extra_subtitle"
        private const val EXTRA_POSITION = "extra_position"
        
        // Constants for integration with DetailsFragment
        const val MEDIA_CONTENT_ID = "media_content_id"
        const val IS_TRAILER = "is_trailer"
        const val START_POSITION = "start_position"
        const val SHARED_ELEMENT_NAME = "hero_image"
        
        /**
         * Create intent to start the player activity
         */
        fun createIntent(
            packageContext: android.content.Context,
            stream: Stream,
            title: String,
            subtitle: String? = null,
            position: Long = 0
        ): Intent {
            return Intent(packageContext, PlayerActivity::class.java).apply {
                putExtra(EXTRA_STREAM_URL, stream.link)
                putExtra(EXTRA_TITLE, title)
                putExtra(EXTRA_SUBTITLE, subtitle)
                putExtra(EXTRA_POSITION, position)
            }
        }
    }
} 
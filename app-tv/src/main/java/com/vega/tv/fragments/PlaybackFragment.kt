package com.vega.tv.fragments

import android.content.Context
import android.graphics.Bitmap
import android.graphics.drawable.Drawable
import android.media.AudioManager
import android.os.Bundle
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaControllerCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import android.util.Log
import android.view.KeyEvent
import android.view.View
import androidx.core.content.ContextCompat
import androidx.leanback.app.PlaybackSupportFragment
import androidx.leanback.app.VideoSupportFragment
import androidx.leanback.app.VideoSupportFragmentGlueHost
import androidx.leanback.media.PlaybackGlue
import androidx.leanback.media.PlaybackTransportControlGlue
import androidx.leanback.widget.Action
import androidx.leanback.widget.ArrayObjectAdapter
import androidx.leanback.widget.PlaybackControlsRow
import androidx.lifecycle.lifecycleScope
import com.bumptech.glide.Glide
import com.bumptech.glide.request.target.CustomTarget
import com.bumptech.glide.request.transition.Transition
import com.google.android.exoplayer2.C
import com.google.android.exoplayer2.ExoPlayer
import com.google.android.exoplayer2.MediaItem
import com.google.android.exoplayer2.Player
import com.google.android.exoplayer2.ext.leanback.LeanbackPlayerAdapter
import com.google.android.exoplayer2.ext.mediasession.MediaSessionConnector
import com.google.android.exoplayer2.trackselection.DefaultTrackSelector
import com.google.android.exoplayer2.ui.SubtitleView
import com.google.android.exoplayer2.util.MimeTypes
import com.vega.shared.models.MediaContent
import com.vega.shared.repositories.ContentRepository
import com.vega.tv.MainApplication
import com.vega.tv.R
import com.vega.tv.utils.TvNavigationHelper
import com.vega.tv.utils.TvPreferences
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

/**
 * PlaybackFragment handles media playback using ExoPlayer and provides transport controls.
 * It integrates with MediaSession for system-wide media control.
 */
class PlaybackFragment : VideoSupportFragment() {

    private val TAG = "PlaybackFragment"
    
    // Player components
    private lateinit var mExoPlayer: ExoPlayer
    private lateinit var mPlayerAdapter: LeanbackPlayerAdapter
    private lateinit var mPlaybackTransportControlGlue: MediaTransportControlGlue
    private lateinit var mMediaSession: MediaSessionCompat
    private lateinit var mMediaSessionConnector: MediaSessionConnector
    private lateinit var mTrackSelector: DefaultTrackSelector
    
    // Repositories and preferences
    private lateinit var mContentRepository: ContentRepository
    private lateinit var mPreferences: TvPreferences
    
    // Content data
    private var mMediaContentId: String? = null
    private var mMediaContent: MediaContent? = null
    private var mStartPosition: Long = 0
    private var mIsTrailer: Boolean = false
    private var mIsPlaying: Boolean = false
    
    // UI components
    private var mSubtitleView: SubtitleView? = null
    
    companion object {
        const val EXTRA_MEDIA_CONTENT_ID = "media_content_id"
        const val EXTRA_START_POSITION = "start_position"
        const val EXTRA_IS_TRAILER = "is_trailer"
        
        // Update interval for the progress bar
        private const val UPDATE_PERIOD = 16L
        
        /**
         * Creates a new instance of PlaybackFragment
         */
        fun newInstance(mediaContentId: String, startPosition: Long = 0, isTrailer: Boolean = false): PlaybackFragment {
            return PlaybackFragment().apply {
                arguments = Bundle().apply {
                    putString(EXTRA_MEDIA_CONTENT_ID, mediaContentId)
                    putLong(EXTRA_START_POSITION, startPosition)
                    putBoolean(EXTRA_IS_TRAILER, isTrailer)
                }
            }
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Get arguments
        mMediaContentId = arguments?.getString(EXTRA_MEDIA_CONTENT_ID)
        mStartPosition = arguments?.getLong(EXTRA_START_POSITION, 0) ?: 0
        mIsTrailer = arguments?.getBoolean(EXTRA_IS_TRAILER, false) ?: false
        
        // Get repositories and preferences
        mContentRepository = MainApplication.from(requireContext()).contentRepository
        mPreferences = MainApplication.from(requireContext()).preferences
        
        // Check if we have a valid media content ID
        if (mMediaContentId == null) {
            Log.e(TAG, "No media content ID provided")
            showError(getString(R.string.error_loading_content))
            return
        }
        
        // Load the media content
        loadMediaContent()
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        // Find the subtitle view
        mSubtitleView = view.findViewById(R.id.exo_subtitles)
    }
    
    /**
     * Load the media content from the repository
     */
    private fun loadMediaContent() {
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
            }
        }
    }
    
    /**
     * Initialize the ExoPlayer and related components
     */
    private fun initializePlayer(content: MediaContent) {
        // Create a track selector for quality selection
        mTrackSelector = DefaultTrackSelector(requireContext())
        
        // Set preferred quality based on user preferences
        val trackParameters = mTrackSelector.buildUponParameters()
            .setMaxVideoSize(1920, 1080) // Default to 1080p
            .build()
        mTrackSelector.parameters = trackParameters
        
        // Create the ExoPlayer instance
        mExoPlayer = ExoPlayer.Builder(requireContext())
            .setTrackSelector(mTrackSelector)
            .build()
        
        // Create the player adapter for Leanback integration
        mPlayerAdapter = LeanbackPlayerAdapter(requireContext(), mExoPlayer, UPDATE_PERIOD)
        
        // Create the playback transport control glue
        val glueHost = VideoSupportFragmentGlueHost(this)
        mPlaybackTransportControlGlue = MediaTransportControlGlue(requireContext(), mPlayerAdapter, content)
        mPlaybackTransportControlGlue.host = glueHost
        
        // Set up media session
        setupMediaSession(content)
        
        // Prepare the media item
        prepareMediaItem(content)
        
        // Set up player listeners
        setupPlayerListeners()
        
        // Start playback
        mPlaybackTransportControlGlue.play()
        mIsPlaying = true
    }
    
    /**
     * Set up the media session for system-wide media control
     */
    private fun setupMediaSession(content: MediaContent) {
        // Create a media session
        mMediaSession = MediaSessionCompat(requireContext(), TAG)
        mMediaSession.isActive = true
        
        // Set up the media session connector
        mMediaSessionConnector = MediaSessionConnector(mMediaSession)
        mMediaSessionConnector.setPlayer(mExoPlayer)
        
        // Update metadata
        updateMediaSessionMetadata(content)
    }
    
    /**
     * Update the media session metadata with content information
     */
    private fun updateMediaSessionMetadata(content: MediaContent) {
        val metadataBuilder = MediaMetadataCompat.Builder()
            .putString(MediaMetadataCompat.METADATA_KEY_DISPLAY_TITLE, content.title)
            .putString(MediaMetadataCompat.METADATA_KEY_DISPLAY_SUBTITLE, content.description)
            .putLong(MediaMetadataCompat.METADATA_KEY_DURATION, content.duration.toLong() * 1000)
            .putString(MediaMetadataCompat.METADATA_KEY_MEDIA_ID, content.id)
        
        // Load artwork for the media session
        Glide.with(requireContext())
            .asBitmap()
            .load(content.imageUrl)
            .into(object : CustomTarget<Bitmap>() {
                override fun onResourceReady(resource: Bitmap, transition: Transition<in Bitmap>?) {
                    metadataBuilder.putBitmap(MediaMetadataCompat.METADATA_KEY_ART, resource)
                    mMediaSession.setMetadata(metadataBuilder.build())
                }
                
                override fun onLoadCleared(placeholder: Drawable?) {
                    // Do nothing
                }
            })
    }
    
    /**
     * Prepare the media item for playback
     */
    private fun prepareMediaItem(content: MediaContent) {
        // Create a media item from the content
        val mediaItem = MediaItem.Builder()
            .setUri(content.videoUrl)
            .setMediaId(content.id)
            .build()
        
        // Set the media item to the player
        mExoPlayer.setMediaItem(mediaItem)
        
        // Prepare the player
        mExoPlayer.prepare()
        
        // Set the playback position if needed
        if (mStartPosition > 0) {
            mExoPlayer.seekTo(mStartPosition)
        }
    }
    
    /**
     * Set up player listeners for handling playback events
     */
    private fun setupPlayerListeners() {
        mExoPlayer.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(state: Int) {
                when (state) {
                    Player.STATE_ENDED -> {
                        // Save playback position
                        savePlaybackPosition()
                        
                        // Return to the previous screen
                        requireActivity().finish()
                    }
                    Player.STATE_READY -> {
                        // Update subtitle visibility based on preferences
                        updateSubtitleVisibility()
                    }
                    Player.STATE_BUFFERING -> {
                        // Show buffering indicator if needed
                    }
                    Player.STATE_IDLE -> {
                        // Handle idle state
                    }
                }
            }
            
            override fun onIsPlayingChanged(isPlaying: Boolean) {
                mIsPlaying = isPlaying
                
                // Update media session playback state
                val state = if (isPlaying) {
                    PlaybackStateCompat.STATE_PLAYING
                } else {
                    PlaybackStateCompat.STATE_PAUSED
                }
                
                val playbackState = PlaybackStateCompat.Builder()
                    .setState(state, mExoPlayer.currentPosition, 1.0f)
                    .build()
                mMediaSession.setPlaybackState(playbackState)
            }
        })
    }
    
    /**
     * Update subtitle visibility based on user preferences
     */
    private fun updateSubtitleVisibility() {
        val subtitlesEnabled = mPreferences.subtitlesEnabled
        mSubtitleView?.visibility = if (subtitlesEnabled) View.VISIBLE else View.GONE
        
        // Set subtitle language if enabled
        if (subtitlesEnabled) {
            val subtitleLanguage = mPreferences.subtitlesLanguage
            // Find and select the appropriate subtitle track
            for (i in 0 until mExoPlayer.currentTrackGroups.length) {
                val trackGroup = mExoPlayer.currentTrackGroups.get(i)
                for (j in 0 until trackGroup.length) {
                    val format = trackGroup.getFormat(j)
                    if (format.sampleMimeType?.startsWith(MimeTypes.TEXT_PREFIX) == true &&
                        format.language == subtitleLanguage) {
                        mTrackSelector.parameters = mTrackSelector.buildUponParameters()
                            .setPreferredTextLanguage(subtitleLanguage)
                            .build()
                        break
                    }
                }
            }
        }
    }
    
    /**
     * Save the current playback position
     */
    private fun savePlaybackPosition() {
        mMediaContentId?.let { contentId ->
            val currentPosition = mExoPlayer.currentPosition
            mPreferences.saveLastWatchedPosition(contentId, currentPosition)
            
            // Add to continue watching if we've watched at least 30 seconds
            if (currentPosition > 30000) {
                mPreferences.addToContinueWatching(contentId)
            }
            
            Log.d(TAG, "Saved playback position: $currentPosition for content: $contentId")
        }
    }
    
    /**
     * Show an error message
     */
    private fun showError(message: String) {
        TvNavigationHelper.showError(
            requireActivity(),
            message,
            { loadMediaContent() }
        )
    }
    
    override fun onPause() {
        super.onPause()
        
        // Save playback position
        savePlaybackPosition()
        
        // Pause playback
        if (::mExoPlayer.isInitialized && mIsPlaying) {
            mExoPlayer.pause()
        }
    }
    
    override fun onResume() {
        super.onResume()
        
        // Resume playback
        if (::mExoPlayer.isInitialized && mIsPlaying) {
            mExoPlayer.play()
        }
    }
    
    override fun onDestroy() {
        super.onDestroy()
        
        // Release resources
        if (::mExoPlayer.isInitialized) {
            mExoPlayer.release()
        }
        
        if (::mMediaSession.isInitialized) {
            mMediaSession.release()
        }
    }
    
    /**
     * Custom transport control glue that shows media content information
     */
    inner class MediaTransportControlGlue(
        context: Context,
        playerAdapter: LeanbackPlayerAdapter,
        private val mediaContent: MediaContent
    ) : PlaybackTransportControlGlue<LeanbackPlayerAdapter>(context, playerAdapter) {
        
        private val mSkipForwardAction = PlaybackControlsRow.SkipNextAction(context)
        private val mSkipBackwardAction = PlaybackControlsRow.SkipPreviousAction(context)
        private val mClosedCaptionAction = PlaybackControlsRow.ClosedCaptioningAction(context)
        private val mQualityAction = PlaybackControlsRow.HighQualityAction(context)
        
        init {
            // Set title and subtitle
            title = mediaContent.title
            subtitle = buildSubtitle(mediaContent)
        }
        
        override fun onCreatePrimaryActions(primaryActionsAdapter: ArrayObjectAdapter) {
            // Add the primary actions
            super.onCreatePrimaryActions(primaryActionsAdapter)
            
            // Add custom actions
            primaryActionsAdapter.add(mSkipBackwardAction)
            primaryActionsAdapter.add(mSkipForwardAction)
            primaryActionsAdapter.add(mClosedCaptionAction)
            primaryActionsAdapter.add(mQualityAction)
        }
        
        override fun onActionClicked(action: Action) {
            when (action) {
                mSkipForwardAction -> skipForward()
                mSkipBackwardAction -> skipBackward()
                mClosedCaptionAction -> toggleClosedCaptions()
                mQualityAction -> showQualityOptions()
                else -> super.onActionClicked(action)
            }
        }
        
        private fun skipForward() {
            val newPosition = playerAdapter.currentPosition + 30000 // 30 seconds
            playerAdapter.seekTo(newPosition)
        }
        
        private fun skipBackward() {
            val newPosition = playerAdapter.currentPosition - 10000 // 10 seconds
            playerAdapter.seekTo(Math.max(0, newPosition))
        }
        
        private fun toggleClosedCaptions() {
            val subtitlesEnabled = !mPreferences.subtitlesEnabled
            mPreferences.subtitlesEnabled = subtitlesEnabled
            updateSubtitleVisibility()
        }
        
        private fun showQualityOptions() {
            // In a real app, you would show a dialog with quality options
            // For now, we'll just toggle between HD and SD
            val currentParameters = mTrackSelector.parameters
            val newParameters = if (currentParameters.maxVideoHeight == 1080) {
                // Switch to SD
                currentParameters.buildUpon()
                    .setMaxVideoSize(854, 480)
                    .build()
            } else {
                // Switch to HD
                currentParameters.buildUpon()
                    .setMaxVideoSize(1920, 1080)
                    .build()
            }
            mTrackSelector.parameters = newParameters
        }
        
        /**
         * Build a subtitle string from the media content
         */
        private fun buildSubtitle(content: MediaContent): String {
            val elements = mutableListOf<String>()
            
            // Add release year if available
            if (content.releaseYear > 0) {
                elements.add(content.releaseYear.toString())
            }
            
            // Add formatted duration if available
            if (content.duration > 0) {
                elements.add(formatDuration(content.duration))
            }
            
            // Add rating if available
            if (content.rating > 0) {
                elements.add(String.format("%.1f★", content.rating))
            }
            
            return elements.joinToString(" • ")
        }
        
        /**
         * Format duration from seconds to a human-readable string
         */
        private fun formatDuration(seconds: Int): String {
            val hours = TimeUnit.SECONDS.toHours(seconds.toLong())
            val minutes = TimeUnit.SECONDS.toMinutes(seconds.toLong()) % 60
            
            return if (hours > 0) {
                String.format("%dh %02dm", hours, minutes)
            } else {
                String.format("%dm", minutes)
            }
        }
    }
} 
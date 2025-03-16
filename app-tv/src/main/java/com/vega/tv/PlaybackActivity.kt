package com.vega.tv

import android.app.PictureInPictureParams
import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import android.os.Build
import android.os.Bundle
import android.util.Rational
import android.view.KeyEvent
import androidx.fragment.app.FragmentActivity
import com.vega.shared.models.MediaContent
import com.vega.tv.fragments.PlaybackFragment

/**
 * PlaybackActivity hosts the PlaybackFragment and handles system-level playback functionality.
 */
class PlaybackActivity : FragmentActivity() {

    companion object {
        const val EXTRA_MEDIA_CONTENT_ID = "media_content_id"
        const val EXTRA_START_POSITION = "start_position"
        const val EXTRA_IS_TRAILER = "is_trailer"
        const val SHARED_ELEMENT_NAME = "hero_image"
        
        /**
         * Create an intent to start the PlaybackActivity
         */
        fun createIntent(
            context: Context,
            mediaContentId: String,
            startPosition: Long = 0,
            isTrailer: Boolean = false
        ): Intent {
            return Intent(context, PlaybackActivity::class.java).apply {
                putExtra(EXTRA_MEDIA_CONTENT_ID, mediaContentId)
                putExtra(EXTRA_START_POSITION, startPosition)
                putExtra(EXTRA_IS_TRAILER, isTrailer)
            }
        }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_playback)
        
        // Get the media content ID from the intent
        val mediaContentId = intent.getStringExtra(EXTRA_MEDIA_CONTENT_ID)
        val startPosition = intent.getLongExtra(EXTRA_START_POSITION, 0)
        val isTrailer = intent.getBooleanExtra(EXTRA_IS_TRAILER, false)
        
        if (mediaContentId == null) {
            finish()
            return
        }
        
        if (savedInstanceState == null) {
            // Create and add the playback fragment
            val fragment = PlaybackFragment.newInstance(
                mediaContentId = mediaContentId,
                startPosition = startPosition,
                isTrailer = isTrailer
            )
            
            // Add the fragment to the container
            supportFragmentManager.beginTransaction()
                .replace(R.id.playback_fragment_container, fragment)
                .commit()
        }
    }
    
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        // Handle media keys
        when (keyCode) {
            KeyEvent.KEYCODE_BACK -> {
                finish()
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }
    
    override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
        // Notify the fragment about PiP mode changes
        val fragment = supportFragmentManager.findFragmentById(R.id.playback_fragment_container) as? PlaybackFragment
        // In a real app, you would handle PiP mode changes in the fragment
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
} 
package com.vega.tv

import android.os.Bundle
import android.view.KeyEvent
import androidx.fragment.app.FragmentActivity
import androidx.leanback.app.BackgroundManager
import androidx.core.content.ContextCompat
import com.vega.shared.repositories.MediaRepository
import com.vega.tv.fragments.MainBrowseFragment

/**
 * TvMainActivity is the main entry point for the TV app.
 * It hosts the MainBrowseFragment which displays content in rows.
 */
class TvMainActivity : FragmentActivity() {

    private lateinit var mBackgroundManager: BackgroundManager
    private lateinit var mMediaRepository: MediaRepository
    private val TAG = "TvMainActivity"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_tv_main)

        // Get the media repository from the application
        mMediaRepository = MainApplication.from(this).mediaRepository

        // Set up the background manager
        setupBackgroundManager()

        // Add the MainBrowseFragment if this is the first creation
        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, MainBrowseFragment.newInstance())
                .commit()
        }
    }

    /**
     * Sets up the background manager for the activity
     */
    private fun setupBackgroundManager() {
        mBackgroundManager = BackgroundManager.getInstance(this)
        mBackgroundManager.attach(window)
        
        // Set default background color
        val defaultBackground = ContextCompat.getColor(this, R.color.background_dark)
        mBackgroundManager.color = defaultBackground
    }

    override fun onDestroy() {
        super.onDestroy()
        mBackgroundManager.release()
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        // Handle custom key events if needed
        return super.onKeyDown(keyCode, event)
    }
} 
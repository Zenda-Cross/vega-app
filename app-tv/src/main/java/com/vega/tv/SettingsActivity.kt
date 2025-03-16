package com.vega.tv

import android.os.Bundle
import androidx.fragment.app.FragmentActivity
import com.vega.tv.fragments.SettingsFragment

/**
 * Activity for displaying app settings in a TV-friendly way.
 */
class SettingsActivity : FragmentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_settings)
        
        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.settings_fragment_container, SettingsFragment())
                .commit()
        }
    }
} 
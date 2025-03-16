package com.vega.tv.fragments

import android.os.Bundle
import androidx.leanback.preference.LeanbackPreferenceFragment
import androidx.leanback.preference.LeanbackSettingsFragment
import androidx.preference.Preference
import androidx.preference.PreferenceFragment
import androidx.preference.PreferenceScreen
import com.vega.tv.MainApplication
import com.vega.tv.R
import com.vega.tv.utils.TvPreferences

/**
 * The main settings fragment for the TV app.
 * Uses the LeanbackSettingsFragment to display settings in a TV-friendly way.
 */
class SettingsFragment : LeanbackSettingsFragment() {

    override fun onPreferenceStartInitialScreen() {
        startPreferenceFragment(MainPreferenceFragment())
    }

    override fun onPreferenceStartFragment(
        preferenceFragment: PreferenceFragment,
        preference: Preference
    ): Boolean {
        val args = preference.extras
        val fragment = childFragmentManager.fragmentFactory.instantiate(
            requireActivity().classLoader,
            preference.fragment!!
        )
        fragment.arguments = args
        startPreferenceFragment(fragment as PreferenceFragment)
        return true
    }

    override fun onPreferenceStartScreen(
        preferenceFragment: PreferenceFragment,
        preferenceScreen: PreferenceScreen
    ): Boolean {
        val fragment = PreferenceFragment()
        startPreferenceFragment(fragment)
        return true
    }

    /**
     * The main preference fragment that displays all settings categories.
     */
    class MainPreferenceFragment : LeanbackPreferenceFragment() {
        
        private lateinit var preferences: TvPreferences
        
        override fun onCreatePreferences(savedInstanceState: Bundle?, rootKey: String?) {
            preferences = MainApplication.from(requireContext()).preferences
            
            // Load preferences from XML
            setPreferencesFromResource(R.xml.preferences, rootKey)
            
            // Set up preference change listeners
            setupPreferenceListeners()
        }
        
        private fun setupPreferenceListeners() {
            // Playback quality preference
            findPreference<Preference>("playback_quality")?.setOnPreferenceChangeListener { _, newValue ->
                preferences.playbackQuality = newValue as String
                true
            }
            
            // Subtitles enabled preference
            findPreference<Preference>("subtitles_enabled")?.setOnPreferenceChangeListener { _, newValue ->
                preferences.subtitlesEnabled = newValue as Boolean
                true
            }
            
            // Subtitles language preference
            findPreference<Preference>("subtitles_language")?.setOnPreferenceChangeListener { _, newValue ->
                preferences.subtitlesLanguage = newValue as String
                true
            }
            
            // Audio language preference
            findPreference<Preference>("audio_language")?.setOnPreferenceChangeListener { _, newValue ->
                preferences.audioLanguage = newValue as String
                true
            }
            
            // Autoplay preference
            findPreference<Preference>("autoplay")?.setOnPreferenceChangeListener { _, newValue ->
                preferences.autoplay = newValue as Boolean
                true
            }
            
            // Logout preference
            findPreference<Preference>("logout")?.setOnPreferenceClickListener {
                // Clear user data and navigate to login screen
                preferences.clearUserData()
                // TODO: Navigate to login screen
                true
            }
            
            // Clear data preference
            findPreference<Preference>("clear_data")?.setOnPreferenceClickListener {
                // Show confirmation dialog before clearing all data
                // TODO: Show confirmation dialog
                true
            }
        }
    }
} 
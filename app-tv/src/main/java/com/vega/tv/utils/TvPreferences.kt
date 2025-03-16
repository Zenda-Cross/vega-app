package com.vega.tv.utils

import android.content.Context
import android.content.SharedPreferences
import androidx.preference.PreferenceManager
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken

/**
 * Helper class for managing TV-specific preferences.
 */
class TvPreferences(context: Context) {

    companion object {
        private const val PREF_PLAYBACK_QUALITY = "playback_quality"
        private const val PREF_SUBTITLES_ENABLED = "subtitles_enabled"
        private const val PREF_SUBTITLES_LANGUAGE = "subtitles_language"
        private const val PREF_AUDIO_LANGUAGE = "audio_language"
        private const val PREF_AUTOPLAY = "autoplay"
        private const val PREF_CONTINUE_WATCHING = "continue_watching"
        private const val PREF_LAST_WATCHED_POSITION = "last_watched_position_"
        private const val PREF_ONBOARDING_COMPLETED = "onboarding_completed"
        private const val PREF_USER_ID = "user_id"
        private const val PREF_USER_NAME = "user_name"
        private const val PREF_USER_EMAIL = "user_email"
        private const val PREF_USER_TOKEN = "user_token"
        private const val PREF_RECENT_SEARCHES = "recent_searches"
        
        // Default values
        private const val DEFAULT_PLAYBACK_QUALITY = "auto"
        private const val DEFAULT_SUBTITLES_ENABLED = false
        private const val DEFAULT_SUBTITLES_LANGUAGE = "en"
        private const val DEFAULT_AUDIO_LANGUAGE = "en"
        private const val DEFAULT_AUTOPLAY = true
        private const val DEFAULT_ONBOARDING_COMPLETED = false
    }
    
    private val prefs: SharedPreferences = PreferenceManager.getDefaultSharedPreferences(context)
    private val gson = Gson()
    
    // Playback preferences
    
    var playbackQuality: String
        get() = prefs.getString(PREF_PLAYBACK_QUALITY, DEFAULT_PLAYBACK_QUALITY) ?: DEFAULT_PLAYBACK_QUALITY
        set(value) = prefs.edit().putString(PREF_PLAYBACK_QUALITY, value).apply()
    
    var subtitlesEnabled: Boolean
        get() = prefs.getBoolean(PREF_SUBTITLES_ENABLED, DEFAULT_SUBTITLES_ENABLED)
        set(value) = prefs.edit().putBoolean(PREF_SUBTITLES_ENABLED, value).apply()
    
    var subtitlesLanguage: String
        get() = prefs.getString(PREF_SUBTITLES_LANGUAGE, DEFAULT_SUBTITLES_LANGUAGE) ?: DEFAULT_SUBTITLES_LANGUAGE
        set(value) = prefs.edit().putString(PREF_SUBTITLES_LANGUAGE, value).apply()
    
    var audioLanguage: String
        get() = prefs.getString(PREF_AUDIO_LANGUAGE, DEFAULT_AUDIO_LANGUAGE) ?: DEFAULT_AUDIO_LANGUAGE
        set(value) = prefs.edit().putString(PREF_AUDIO_LANGUAGE, value).apply()
    
    var autoplay: Boolean
        get() = prefs.getBoolean(PREF_AUTOPLAY, DEFAULT_AUTOPLAY)
        set(value) = prefs.edit().putBoolean(PREF_AUTOPLAY, value).apply()
    
    // Continue watching
    
    fun getContinueWatchingIds(): Set<String> {
        return prefs.getStringSet(PREF_CONTINUE_WATCHING, emptySet()) ?: emptySet()
    }
    
    fun addToContinueWatching(contentId: String) {
        val currentIds = getContinueWatchingIds().toMutableSet()
        currentIds.add(contentId)
        prefs.edit().putStringSet(PREF_CONTINUE_WATCHING, currentIds).apply()
    }
    
    fun removeFromContinueWatching(contentId: String) {
        val currentIds = getContinueWatchingIds().toMutableSet()
        currentIds.remove(contentId)
        prefs.edit().putStringSet(PREF_CONTINUE_WATCHING, currentIds).apply()
    }
    
    fun saveLastWatchedPosition(contentId: String, position: Long) {
        prefs.edit().putLong("$PREF_LAST_WATCHED_POSITION$contentId", position).apply()
    }
    
    fun getLastWatchedPosition(contentId: String): Long {
        return prefs.getLong("$PREF_LAST_WATCHED_POSITION$contentId", 0)
    }
    
    // Onboarding
    
    var onboardingCompleted: Boolean
        get() = prefs.getBoolean(PREF_ONBOARDING_COMPLETED, DEFAULT_ONBOARDING_COMPLETED)
        set(value) = prefs.edit().putBoolean(PREF_ONBOARDING_COMPLETED, value).apply()
    
    // User information
    
    var userId: String?
        get() = prefs.getString(PREF_USER_ID, null)
        set(value) = prefs.edit().putString(PREF_USER_ID, value).apply()
    
    var userName: String?
        get() = prefs.getString(PREF_USER_NAME, null)
        set(value) = prefs.edit().putString(PREF_USER_NAME, value).apply()
    
    var userEmail: String?
        get() = prefs.getString(PREF_USER_EMAIL, null)
        set(value) = prefs.edit().putString(PREF_USER_EMAIL, value).apply()
    
    var userToken: String?
        get() = prefs.getString(PREF_USER_TOKEN, null)
        set(value) = prefs.edit().putString(PREF_USER_TOKEN, value).apply()
    
    fun isUserLoggedIn(): Boolean {
        return !userId.isNullOrEmpty() && !userToken.isNullOrEmpty()
    }
    
    fun clearUserData() {
        prefs.edit()
            .remove(PREF_USER_ID)
            .remove(PREF_USER_NAME)
            .remove(PREF_USER_EMAIL)
            .remove(PREF_USER_TOKEN)
            .apply()
    }
    
    fun clearAllPreferences() {
        prefs.edit().clear().apply()
    }
    
    // Recent searches
    
    /**
     * Get the list of recent searches
     */
    fun getRecentSearches(): List<String> {
        val json = prefs.getString(PREF_RECENT_SEARCHES, null)
        return if (json != null) {
            val type = object : TypeToken<List<String>>() {}.type
            gson.fromJson(json, type)
        } else {
            emptyList()
        }
    }
    
    /**
     * Save the list of recent searches
     */
    fun saveRecentSearches(searches: List<String>) {
        val json = gson.toJson(searches)
        prefs.edit().putString(PREF_RECENT_SEARCHES, json).apply()
    }
    
    /**
     * Clear all recent searches
     */
    fun clearRecentSearches() {
        prefs.edit().remove(PREF_RECENT_SEARCHES).apply()
    }
} 
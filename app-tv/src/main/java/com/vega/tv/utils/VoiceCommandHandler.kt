package com.vega.tv.utils

import android.app.SearchManager
import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.fragment.app.FragmentActivity

/**
 * Utility class for handling voice commands from Android TV remotes.
 * Provides a unified interface for processing voice input and executing corresponding actions.
 */
class VoiceCommandHandler(private val context: Context) {

    private val commandHandlers = mutableMapOf<String, (List<String>) -> Boolean>()
    private var defaultHandler: ((String) -> Boolean)? = null
    private var remoteControlHandler: RemoteControlHandler? = null

    /**
     * Sets the remote control handler for media-related voice commands.
     *
     * @param handler The remote control handler
     */
    fun setRemoteControlHandler(handler: RemoteControlHandler) {
        remoteControlHandler = handler
    }

    /**
     * Registers a command handler for a specific command pattern.
     *
     * @param commandPattern The command pattern to match (case-insensitive)
     * @param handler The handler function that processes the command
     */
    fun registerCommandHandler(commandPattern: String, handler: (List<String>) -> Boolean) {
        commandHandlers[commandPattern.lowercase()] = handler
    }

    /**
     * Sets a default handler for commands that don't match any registered patterns.
     *
     * @param handler The default handler function
     */
    fun setDefaultHandler(handler: (String) -> Boolean) {
        defaultHandler = handler
    }

    /**
     * Processes a voice command and executes the corresponding action.
     *
     * @param command The voice command to process
     * @return true if the command was handled, false otherwise
     */
    fun processCommand(command: String): Boolean {
        // Try to handle with remote control handler first
        if (remoteControlHandler?.handleVoiceCommand(command) == true) {
            return true
        }

        // Check for registered command patterns
        for ((pattern, handler) in commandHandlers) {
            if (command.lowercase().contains(pattern)) {
                // Extract parameters from the command
                val params = extractParameters(command, pattern)
                return handler(params)
            }
        }

        // Use default handler if available
        return defaultHandler?.invoke(command) ?: false
    }

    /**
     * Extracts parameters from a command based on a pattern.
     *
     * @param command The command to extract parameters from
     * @param pattern The pattern to match
     * @return A list of extracted parameters
     */
    private fun extractParameters(command: String, pattern: String): List<String> {
        val commandLower = command.lowercase()
        val patternLower = pattern.lowercase()
        
        // Simple parameter extraction - everything after the pattern
        if (commandLower.startsWith(patternLower)) {
            val paramString = command.substring(pattern.length).trim()
            return if (paramString.isNotEmpty()) {
                listOf(paramString)
            } else {
                emptyList()
            }
        }
        
        // If the pattern is in the middle, try to extract parameters from both sides
        val patternIndex = commandLower.indexOf(patternLower)
        if (patternIndex > 0) {
            val before = command.substring(0, patternIndex).trim()
            val after = command.substring(patternIndex + pattern.length).trim()
            
            val params = mutableListOf<String>()
            if (before.isNotEmpty()) {
                params.add(before)
            }
            if (after.isNotEmpty()) {
                params.add(after)
            }
            
            return params
        }
        
        return emptyList()
    }

    /**
     * Handles a search intent from the Android TV search interface.
     *
     * @param activity The activity that received the search intent
     * @param intent The search intent
     * @return true if the intent was handled, false otherwise
     */
    fun handleSearchIntent(activity: FragmentActivity, intent: Intent): Boolean {
        if (Intent.ACTION_SEARCH == intent.action) {
            val query = intent.getStringExtra(SearchManager.QUERY) ?: return false
            return processCommand(query)
        }
        
        return false
    }

    /**
     * Registers common voice commands for navigation and playback control.
     */
    fun registerCommonCommands() {
        // Navigation commands
        registerCommandHandler("go to home", { _ ->
            navigateTo("home")
            true
        })
        
        registerCommandHandler("go to", { params ->
            if (params.isNotEmpty()) {
                navigateTo(params[0])
                true
            } else {
                false
            }
        })
        
        registerCommandHandler("open", { params ->
            if (params.isNotEmpty()) {
                navigateTo(params[0])
                true
            } else {
                false
            }
        })
        
        registerCommandHandler("show", { params ->
            if (params.isNotEmpty()) {
                navigateTo(params[0])
                true
            } else {
                false
            }
        })
        
        // Search commands
        registerCommandHandler("search for", { params ->
            if (params.isNotEmpty()) {
                performSearch(params[0])
                true
            } else {
                false
            }
        })
        
        registerCommandHandler("find", { params ->
            if (params.isNotEmpty()) {
                performSearch(params[0])
                true
            } else {
                false
            }
        })
        
        // Settings commands
        registerCommandHandler("settings", { _ ->
            openSettings()
            true
        })
        
        registerCommandHandler("preferences", { _ ->
            openSettings()
            true
        })
    }

    /**
     * Navigates to a specific destination in the app.
     *
     * @param destination The destination to navigate to
     */
    private fun navigateTo(destination: String) {
        // This should be implemented based on the app's navigation structure
        when (destination.lowercase()) {
            "home" -> {
                val intent = Intent(context, getActivityClassByName("TvMainActivity"))
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                context.startActivity(intent)
            }
            "search" -> {
                val intent = Intent(context, getActivityClassByName("SearchActivity"))
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
                context.startActivity(intent)
            }
            "settings" -> {
                openSettings()
            }
            else -> {
                // Try to find a matching category or content
                performSearch(destination)
            }
        }
    }

    /**
     * Performs a search for the given query.
     *
     * @param query The search query
     */
    private fun performSearch(query: String) {
        val intent = Intent(context, getActivityClassByName("SearchActivity"))
        intent.action = Intent.ACTION_SEARCH
        intent.putExtra(SearchManager.QUERY, query)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        context.startActivity(intent)
    }

    /**
     * Opens the settings screen.
     */
    private fun openSettings() {
        val intent = Intent(context, getActivityClassByName("SettingsActivity"))
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        context.startActivity(intent)
    }

    /**
     * Gets the class for an activity by name.
     *
     * @param activityName The name of the activity
     * @return The activity class
     */
    private fun getActivityClassByName(activityName: String): Class<*> {
        return try {
            Class.forName("com.vega.tv.$activityName")
        } catch (e: ClassNotFoundException) {
            // Fallback to main activity if the specified activity is not found
            Class.forName("com.vega.tv.TvMainActivity")
        }
    }

    companion object {
        /**
         * Creates a voice command handler with common commands registered.
         *
         * @param context The application context
         * @return A voice command handler with common commands
         */
        fun createWithCommonCommands(context: Context): VoiceCommandHandler {
            val handler = VoiceCommandHandler(context)
            handler.registerCommonCommands()
            return handler
        }
    }
} 
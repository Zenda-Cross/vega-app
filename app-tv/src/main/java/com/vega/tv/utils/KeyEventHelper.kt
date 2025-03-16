package com.vega.tv.utils

import android.view.KeyEvent
import android.view.View

/**
 * Utility class for handling key events and providing shortcuts for common actions.
 * Helps with implementing consistent key event handling across the application.
 */
object KeyEventHelper {

    /**
     * Represents a shortcut mapping a key code to an action.
     */
    data class Shortcut(
        val keyCode: Int,
        val action: () -> Boolean,
        val requiresLongPress: Boolean = false,
        val requiresShift: Boolean = false,
        val requiresAlt: Boolean = false,
        val requiresCtrl: Boolean = false
    )

    /**
     * Handles a key event using the provided shortcuts.
     *
     * @param event The key event to handle
     * @param shortcuts The shortcuts to check against
     * @return true if the event was handled, false otherwise
     */
    fun handleKeyEvent(event: KeyEvent, shortcuts: List<Shortcut>): Boolean {
        // Only handle key down events to avoid duplicate handling
        if (event.action != KeyEvent.ACTION_DOWN) {
            return false
        }
        
        // Find a matching shortcut
        val shortcut = shortcuts.find { shortcut ->
            shortcut.keyCode == event.keyCode &&
            shortcut.requiresLongPress == event.isLongPress &&
            shortcut.requiresShift == event.isShiftPressed &&
            shortcut.requiresAlt == event.isAltPressed &&
            shortcut.requiresCtrl == event.isCtrlPressed
        }
        
        // Execute the action if a matching shortcut was found
        return shortcut?.action?.invoke() ?: false
    }

    /**
     * Creates a set of common shortcuts for navigation.
     *
     * @param onBack Action to perform when the back button is pressed
     * @param onHome Action to perform when the home button is pressed
     * @param onMenu Action to perform when the menu button is pressed
     * @return A list of shortcuts
     */
    fun createNavigationShortcuts(
        onBack: () -> Boolean,
        onHome: () -> Boolean,
        onMenu: () -> Boolean
    ): List<Shortcut> {
        return listOf(
            Shortcut(KeyEvent.KEYCODE_BACK, onBack),
            Shortcut(KeyEvent.KEYCODE_HOME, onHome),
            Shortcut(KeyEvent.KEYCODE_MENU, onMenu)
        )
    }

    /**
     * Creates a set of common shortcuts for media playback.
     *
     * @param onPlayPause Action to perform when play/pause is pressed
     * @param onStop Action to perform when stop is pressed
     * @param onNext Action to perform when next is pressed
     * @param onPrevious Action to perform when previous is pressed
     * @param onRewind Action to perform when rewind is pressed
     * @param onFastForward Action to perform when fast forward is pressed
     * @return A list of shortcuts
     */
    fun createMediaShortcuts(
        onPlayPause: () -> Boolean,
        onStop: () -> Boolean,
        onNext: () -> Boolean,
        onPrevious: () -> Boolean,
        onRewind: () -> Boolean,
        onFastForward: () -> Boolean
    ): List<Shortcut> {
        return listOf(
            Shortcut(KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE, onPlayPause),
            Shortcut(KeyEvent.KEYCODE_MEDIA_PLAY, onPlayPause),
            Shortcut(KeyEvent.KEYCODE_MEDIA_PAUSE, onPlayPause),
            Shortcut(KeyEvent.KEYCODE_MEDIA_STOP, onStop),
            Shortcut(KeyEvent.KEYCODE_MEDIA_NEXT, onNext),
            Shortcut(KeyEvent.KEYCODE_MEDIA_PREVIOUS, onPrevious),
            Shortcut(KeyEvent.KEYCODE_MEDIA_REWIND, onRewind),
            Shortcut(KeyEvent.KEYCODE_MEDIA_FAST_FORWARD, onFastForward)
        )
    }

    /**
     * Creates a set of common shortcuts for D-pad navigation in a media player.
     *
     * @param onCenter Action to perform when the D-pad center button is pressed
     * @param onUp Action to perform when the D-pad up button is pressed
     * @param onDown Action to perform when the D-pad down button is pressed
     * @param onLeft Action to perform when the D-pad left button is pressed
     * @param onRight Action to perform when the D-pad right button is pressed
     * @param onLeftLong Action to perform when the D-pad left button is long-pressed
     * @param onRightLong Action to perform when the D-pad right button is long-pressed
     * @return A list of shortcuts
     */
    fun createDpadMediaShortcuts(
        onCenter: () -> Boolean,
        onUp: () -> Boolean,
        onDown: () -> Boolean,
        onLeft: () -> Boolean,
        onRight: () -> Boolean,
        onLeftLong: () -> Boolean,
        onRightLong: () -> Boolean
    ): List<Shortcut> {
        return listOf(
            Shortcut(KeyEvent.KEYCODE_DPAD_CENTER, onCenter),
            Shortcut(KeyEvent.KEYCODE_ENTER, onCenter),
            Shortcut(KeyEvent.KEYCODE_NUMPAD_ENTER, onCenter),
            Shortcut(KeyEvent.KEYCODE_DPAD_UP, onUp),
            Shortcut(KeyEvent.KEYCODE_DPAD_DOWN, onDown),
            Shortcut(KeyEvent.KEYCODE_DPAD_LEFT, onLeft),
            Shortcut(KeyEvent.KEYCODE_DPAD_RIGHT, onRight),
            Shortcut(KeyEvent.KEYCODE_DPAD_LEFT, onLeftLong, requiresLongPress = true),
            Shortcut(KeyEvent.KEYCODE_DPAD_RIGHT, onRightLong, requiresLongPress = true)
        )
    }

    /**
     * Creates a set of common shortcuts for gamepad input in a media player.
     *
     * @param onA Action to perform when the A button is pressed
     * @param onB Action to perform when the B button is pressed
     * @param onX Action to perform when the X button is pressed
     * @param onY Action to perform when the Y button is pressed
     * @param onL1 Action to perform when the L1 button is pressed
     * @param onR1 Action to perform when the R1 button is pressed
     * @param onStart Action to perform when the Start button is pressed
     * @param onSelect Action to perform when the Select button is pressed
     * @return A list of shortcuts
     */
    fun createGamepadMediaShortcuts(
        onA: () -> Boolean,
        onB: () -> Boolean,
        onX: () -> Boolean,
        onY: () -> Boolean,
        onL1: () -> Boolean,
        onR1: () -> Boolean,
        onStart: () -> Boolean,
        onSelect: () -> Boolean
    ): List<Shortcut> {
        return listOf(
            Shortcut(KeyEvent.KEYCODE_BUTTON_A, onA),
            Shortcut(KeyEvent.KEYCODE_BUTTON_B, onB),
            Shortcut(KeyEvent.KEYCODE_BUTTON_X, onX),
            Shortcut(KeyEvent.KEYCODE_BUTTON_Y, onY),
            Shortcut(KeyEvent.KEYCODE_BUTTON_L1, onL1),
            Shortcut(KeyEvent.KEYCODE_BUTTON_R1, onR1),
            Shortcut(KeyEvent.KEYCODE_BUTTON_START, onStart),
            Shortcut(KeyEvent.KEYCODE_BUTTON_SELECT, onSelect)
        )
    }

    /**
     * Sets up a key listener for a view with the provided shortcuts.
     *
     * @param view The view to set up the key listener for
     * @param shortcuts The shortcuts to use
     */
    fun setupKeyListener(view: View, shortcuts: List<Shortcut>) {
        view.setOnKeyListener { _, _, event ->
            handleKeyEvent(event, shortcuts)
        }
    }
} 
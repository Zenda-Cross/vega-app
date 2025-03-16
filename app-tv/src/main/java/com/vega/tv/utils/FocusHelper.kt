package com.vega.tv.utils

import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import androidx.core.view.ViewCompat
import androidx.leanback.widget.VerticalGridView
import androidx.recyclerview.widget.RecyclerView

/**
 * Helper class for managing focus in TV layouts.
 * Provides utilities for handling D-pad navigation and focus traversal.
 */
object FocusHelper {

    /**
     * Sets up focus handling for a RecyclerView or VerticalGridView.
     * Ensures that focus is properly maintained when navigating within the grid.
     *
     * @param recyclerView The RecyclerView or VerticalGridView to set up
     * @param defaultFocusPosition The default position to focus when the grid gains focus
     */
    fun setupGridViewFocus(recyclerView: RecyclerView, defaultFocusPosition: Int = 0) {
        recyclerView.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus && recyclerView.childCount > 0) {
                // When the grid gains focus, focus the first visible item or the default position
                val position = if (defaultFocusPosition < recyclerView.childCount) {
                    defaultFocusPosition
                } else {
                    0
                }
                
                recyclerView.getChildAt(position)?.requestFocus()
            }
        }
    }

    /**
     * Handles key events for a view to implement custom focus traversal.
     * Returns true if the event was handled, false otherwise.
     *
     * @param view The view handling the key event
     * @param event The key event
     * @param upView The view to focus when navigating up (optional)
     * @param downView The view to focus when navigating down (optional)
     * @param leftView The view to focus when navigating left (optional)
     * @param rightView The view to focus when navigating right (optional)
     * @return true if the event was handled, false otherwise
     */
    fun handleKeyEvent(
        view: View,
        event: KeyEvent,
        upView: View? = null,
        downView: View? = null,
        leftView: View? = null,
        rightView: View? = null
    ): Boolean {
        if (event.action != KeyEvent.ACTION_DOWN) {
            return false
        }

        return when (event.keyCode) {
            KeyEvent.KEYCODE_DPAD_UP -> {
                upView?.requestFocus() ?: return false
                true
            }
            KeyEvent.KEYCODE_DPAD_DOWN -> {
                downView?.requestFocus() ?: return false
                true
            }
            KeyEvent.KEYCODE_DPAD_LEFT -> {
                leftView?.requestFocus() ?: return false
                true
            }
            KeyEvent.KEYCODE_DPAD_RIGHT -> {
                rightView?.requestFocus() ?: return false
                true
            }
            else -> false
        }
    }

    /**
     * Finds the first focusable view in a ViewGroup.
     *
     * @param viewGroup The ViewGroup to search
     * @return The first focusable view, or null if none found
     */
    fun findFirstFocusableView(viewGroup: ViewGroup): View? {
        for (i in 0 until viewGroup.childCount) {
            val child = viewGroup.getChildAt(i)
            
            if (child.visibility == View.VISIBLE && child.isFocusable) {
                return child
            } else if (child is ViewGroup) {
                val focusableChild = findFirstFocusableView(child)
                if (focusableChild != null) {
                    return focusableChild
                }
            }
        }
        
        return null
    }

    /**
     * Restores focus to a view, or finds an appropriate view to focus if the original is not available.
     *
     * @param container The container ViewGroup
     * @param savedFocusId The ID of the previously focused view
     * @return true if focus was restored, false otherwise
     */
    fun restoreFocus(container: ViewGroup, savedFocusId: Int): Boolean {
        if (savedFocusId != View.NO_ID) {
            val savedFocusView = container.findViewById<View>(savedFocusId)
            if (savedFocusView != null && savedFocusView.isFocusable && savedFocusView.visibility == View.VISIBLE) {
                return savedFocusView.requestFocus()
            }
        }
        
        // If we couldn't restore to the saved view, find the first focusable view
        val firstFocusable = findFirstFocusableView(container)
        return firstFocusable?.requestFocus() ?: false
    }

    /**
     * Sets up a view to handle focus animations.
     * Applies scale animation when the view gains or loses focus.
     *
     * @param view The view to set up
     * @param scaleX The X scale factor when focused (default 1.1f)
     * @param scaleY The Y scale factor when focused (default 1.1f)
     * @param duration The animation duration in milliseconds (default 150)
     */
    fun setupFocusAnimation(
        view: View,
        scaleX: Float = 1.1f,
        scaleY: Float = 1.1f,
        duration: Long = 150
    ) {
        view.setOnFocusChangeListener { v, hasFocus ->
            if (hasFocus) {
                ViewCompat.animate(v)
                    .scaleX(scaleX)
                    .scaleY(scaleY)
                    .translationZ(v.resources.displayMetrics.density * 8)
                    .setDuration(duration)
                    .start()
            } else {
                ViewCompat.animate(v)
                    .scaleX(1.0f)
                    .scaleY(1.0f)
                    .translationZ(0f)
                    .setDuration(duration)
                    .start()
            }
        }
    }

    /**
     * Applies focus animations to all focusable children in a ViewGroup.
     *
     * @param viewGroup The ViewGroup containing focusable children
     * @param scaleX The X scale factor when focused (default 1.1f)
     * @param scaleY The Y scale factor when focused (default 1.1f)
     * @param duration The animation duration in milliseconds (default 150)
     */
    fun setupFocusAnimationForChildren(
        viewGroup: ViewGroup,
        scaleX: Float = 1.1f,
        scaleY: Float = 1.1f,
        duration: Long = 150
    ) {
        for (i in 0 until viewGroup.childCount) {
            val child = viewGroup.getChildAt(i)
            
            if (child.isFocusable && child.visibility == View.VISIBLE) {
                setupFocusAnimation(child, scaleX, scaleY, duration)
            }
            
            if (child is ViewGroup) {
                setupFocusAnimationForChildren(child, scaleX, scaleY, duration)
            }
        }
    }
} 
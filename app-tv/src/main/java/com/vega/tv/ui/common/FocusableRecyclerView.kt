package com.vega.tv.ui.common

import android.content.Context
import android.graphics.Rect
import android.util.AttributeSet
import android.view.FocusFinder
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.vega.tv.utils.FocusHelper

/**
 * A custom RecyclerView that provides enhanced focus handling for TV navigation.
 * Helps with D-pad navigation in grid layouts.
 */
class FocusableRecyclerView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : RecyclerView(context, attrs, defStyleAttr) {

    private var lastFocusedPosition = 0
    private var focusChangedListener: ((View, Boolean) -> Unit)? = null
    private var defaultFocusPosition = 0
    private var focusSearchFailedListener: ((Int, View) -> View?)? = null

    init {
        // Set up focus handling
        descendantFocusability = ViewGroup.FOCUS_AFTER_DESCENDANTS
        isFocusable = true
        isFocusableInTouchMode = true
    }

    /**
     * Sets the default position to focus when this RecyclerView gains focus.
     *
     * @param position The default position to focus
     */
    fun setDefaultFocusPosition(position: Int) {
        defaultFocusPosition = position
    }

    /**
     * Sets a listener to be called when focus changes within this RecyclerView.
     *
     * @param listener The focus change listener
     */
    fun setOnChildFocusChangeListener(listener: (View, Boolean) -> Unit) {
        focusChangedListener = listener
    }

    /**
     * Sets a listener to be called when focus search fails.
     * This allows custom handling of focus movement at the edges of the grid.
     *
     * @param listener The focus search failed listener
     */
    fun setOnFocusSearchFailedListener(listener: (Int, View) -> View?) {
        focusSearchFailedListener = listener
    }

    override fun onFocusChanged(gainFocus: Boolean, direction: Int, previouslyFocusedRect: Rect?) {
        super.onFocusChanged(gainFocus, direction, previouslyFocusedRect)
        
        if (gainFocus && childCount > 0) {
            // When this RecyclerView gains focus, try to focus the last focused position or the default position
            val position = if (lastFocusedPosition >= 0 && lastFocusedPosition < childCount) {
                lastFocusedPosition
            } else if (defaultFocusPosition >= 0 && defaultFocusPosition < childCount) {
                defaultFocusPosition
            } else {
                0
            }
            
            getChildAt(position)?.requestFocus()
        }
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        // Store the position of the currently focused child
        val focused = findFocus()
        if (focused != null && focused != this) {
            for (i in 0 until childCount) {
                if (getChildAt(i) == focused || getChildAt(i).descendantFocusability == ViewGroup.FOCUS_BLOCK_DESCENDANTS) {
                    lastFocusedPosition = i
                    break
                }
            }
        }
        
        return super.dispatchKeyEvent(event)
    }

    override fun requestChildFocus(child: View, focused: View) {
        super.requestChildFocus(child, focused)
        
        // Find the position of the focused child
        for (i in 0 until childCount) {
            if (getChildAt(i) == child) {
                lastFocusedPosition = i
                break
            }
        }
        
        // Notify the focus change listener
        focusChangedListener?.invoke(child, true)
    }

    /**
     * Handles custom focus search logic for D-pad navigation.
     * Tries to find the next focusable view in the specified direction.
     *
     * @param focused The currently focused view
     * @param direction The direction to search
     * @return The next focusable view, or null if none found
     */
    override fun focusSearch(focused: View, direction: Int): View? {
        // Use the default focus search first
        val nextFocus = FocusFinder.getInstance().findNextFocus(this, focused, direction)
        
        if (nextFocus != null) {
            return nextFocus
        }
        
        // If the default focus search fails, try custom handling
        if (focusSearchFailedListener != null) {
            return focusSearchFailedListener?.invoke(direction, focused)
        }
        
        // If we reach the edge of the grid, handle focus movement based on the direction
        when (direction) {
            View.FOCUS_LEFT -> {
                // If we're at the left edge, try to focus the last item in the previous row
                val position = getChildAdapterPosition(focused)
                val spanCount = (layoutManager as? androidx.recyclerview.widget.GridLayoutManager)?.spanCount ?: 1
                
                if (position % spanCount == 0 && position >= spanCount) {
                    // We're at the left edge of a row, try to focus the last item in the previous row
                    val targetPosition = position - 1
                    if (targetPosition >= 0) {
                        val targetView = findViewHolderForAdapterPosition(targetPosition)?.itemView
                        if (targetView != null && targetView.isFocusable) {
                            return targetView
                        }
                    }
                }
            }
            View.FOCUS_RIGHT -> {
                // If we're at the right edge, try to focus the first item in the next row
                val position = getChildAdapterPosition(focused)
                val spanCount = (layoutManager as? androidx.recyclerview.widget.GridLayoutManager)?.spanCount ?: 1
                
                if ((position + 1) % spanCount == 0) {
                    // We're at the right edge of a row, try to focus the first item in the next row
                    val targetPosition = position + 1
                    if (targetPosition < adapter?.itemCount ?: 0) {
                        val targetView = findViewHolderForAdapterPosition(targetPosition)?.itemView
                        if (targetView != null && targetView.isFocusable) {
                            return targetView
                        }
                    }
                }
            }
        }
        
        // If all else fails, return the default result
        return super.focusSearch(focused, direction)
    }

    /**
     * Scrolls to make the focused item visible if needed.
     */
    override fun onRequestFocusInDescendants(direction: Int, previouslyFocusedRect: Rect?): Boolean {
        val result = super.onRequestFocusInDescendants(direction, previouslyFocusedRect)
        
        // Scroll to make the focused item visible if needed
        val focused = findFocus()
        if (focused != null) {
            val focusedRect = Rect()
            focused.getFocusedRect(focusedRect)
            offsetDescendantRectToMyCoords(focused, focusedRect)
            requestChildRectangleOnScreen(focused, focusedRect, false)
        }
        
        return result
    }
} 
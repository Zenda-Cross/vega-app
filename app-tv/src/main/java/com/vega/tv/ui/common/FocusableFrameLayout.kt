package com.vega.tv.ui.common

import android.content.Context
import android.graphics.Rect
import android.util.AttributeSet
import android.view.FocusFinder
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import com.vega.tv.utils.FocusHelper

/**
 * A custom FrameLayout that provides enhanced focus handling for TV navigation.
 * Helps with D-pad navigation in complex layouts.
 */
class FocusableFrameLayout @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : FrameLayout(context, attrs, defStyleAttr) {

    private var lastFocusedViewId = View.NO_ID
    private var defaultFocusView: View? = null
    private var focusChangedListener: ((View, Boolean) -> Unit)? = null

    /**
     * Sets the default view to focus when this layout gains focus.
     *
     * @param view The view to focus by default
     */
    fun setDefaultFocusView(view: View) {
        defaultFocusView = view
    }

    /**
     * Sets a listener to be called when focus changes within this layout.
     *
     * @param listener The focus change listener
     */
    fun setOnChildFocusChangeListener(listener: (View, Boolean) -> Unit) {
        focusChangedListener = listener
    }

    override fun onFinishInflate() {
        super.onFinishInflate()
        
        // Find all focusable children and set up focus animations
        FocusHelper.setupFocusAnimationForChildren(this)
    }

    override fun onFocusChanged(gainFocus: Boolean, direction: Int, previouslyFocusedRect: Rect?) {
        super.onFocusChanged(gainFocus, direction, previouslyFocusedRect)
        
        if (gainFocus) {
            // When this layout gains focus, try to focus the last focused view or the default view
            if (lastFocusedViewId != View.NO_ID) {
                val lastFocusedView = findViewById<View>(lastFocusedViewId)
                if (lastFocusedView != null && lastFocusedView.isFocusable && lastFocusedView.visibility == View.VISIBLE) {
                    lastFocusedView.requestFocus()
                    return
                }
            }
            
            // If no last focused view, try the default view
            if (defaultFocusView != null && defaultFocusView!!.isFocusable && defaultFocusView!!.visibility == View.VISIBLE) {
                defaultFocusView!!.requestFocus()
                return
            }
            
            // Otherwise, find the first focusable child
            val firstFocusable = FocusHelper.findFirstFocusableView(this)
            firstFocusable?.requestFocus()
        }
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        // Store the currently focused view when it's a child of this layout
        val focused = findFocus()
        if (focused != null && focused != this) {
            lastFocusedViewId = focused.id
        }
        
        return super.dispatchKeyEvent(event)
    }

    override fun addFocusables(views: ArrayList<View>, direction: Int, focusableMode: Int) {
        // If this layout has no focusable children, don't add itself to the list
        if (childCount == 0 || FocusHelper.findFirstFocusableView(this) == null) {
            return
        }
        
        super.addFocusables(views, direction, focusableMode)
    }

    override fun requestChildFocus(child: View, focused: View) {
        super.requestChildFocus(child, focused)
        
        // Store the ID of the focused child
        if (child.id != View.NO_ID) {
            lastFocusedViewId = child.id
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
        val nextFocus = super.focusSearch(focused, direction)
        
        // If the next focus is not a child of this layout, try to find a better match
        if (nextFocus != null && !isViewAChildOfThis(nextFocus)) {
            // Try to find a better match within this layout
            val finder = FocusFinder.getInstance()
            val focusableChildren = ArrayList<View>()
            findFocusableChildren(this, focusableChildren)
            
            if (focusableChildren.isNotEmpty()) {
                val betterMatch = finder.findNextFocus(this, focused, direction)
                if (betterMatch != null && betterMatch != focused) {
                    return betterMatch
                }
            }
        }
        
        return nextFocus
    }

    /**
     * Checks if a view is a child of this layout.
     *
     * @param view The view to check
     * @return true if the view is a child of this layout, false otherwise
     */
    private fun isViewAChildOfThis(view: View): Boolean {
        var parent = view.parent
        while (parent != null) {
            if (parent == this) {
                return true
            }
            parent = parent.parent
        }
        return false
    }

    /**
     * Recursively finds all focusable children in a ViewGroup.
     *
     * @param viewGroup The ViewGroup to search
     * @param focusableChildren The list to add focusable children to
     */
    private fun findFocusableChildren(viewGroup: ViewGroup, focusableChildren: ArrayList<View>) {
        for (i in 0 until viewGroup.childCount) {
            val child = viewGroup.getChildAt(i)
            
            if (child.visibility == View.VISIBLE) {
                if (child.isFocusable) {
                    focusableChildren.add(child)
                }
                
                if (child is ViewGroup) {
                    findFocusableChildren(child, focusableChildren)
                }
            }
        }
    }
} 
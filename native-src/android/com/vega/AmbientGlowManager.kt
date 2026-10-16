package com.vega

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import android.view.Choreographer
import android.view.View
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import kotlin.math.abs
import kotlin.math.exp
import kotlin.math.roundToInt

/** A single opaque color field: target changes never reset its displayed colors. */
class AmbientGlowView(context: ThemedReactContext) : View(context), Choreographer.FrameCallback {
    private val current = FloatArray(12)
    private val target = FloatArray(12)
    private val paints = Array(4) { Paint() }
    private val fades = Array(4) { Paint() }
    private val rectangles = Array(4) { RectF() }
    private val drawnColors = IntArray(4) { Color.BLACK }
    private val cachedColors = IntArray(4) { -1 }
    private val bounds = FloatArray(4)
    private var shadersDirty = true
    private var queued = false
    private var lastFrame = 0L
    var strength = 0.35f
        set(value) { field = value.coerceIn(0f, 1f); invalidate() }

    init {
        isFocusable = false
        isClickable = false
        importantForAccessibility = IMPORTANT_FOR_ACCESSIBILITY_NO
    }

    fun palette(values: ReadableArray?) {
        if (values == null || values.size() != 4) return
        val parsed = try { IntArray(4) { Color.parseColor(values.getString(it)) } } catch (_: Exception) { return }
        for (i in 0..3) {
            val channels = intArrayOf(Color.red(parsed[i]), Color.green(parsed[i]), Color.blue(parsed[i]))
            for (channel in 0..2) {
                val index = i * 3 + channel
                // Ignore tiny compression/noise changes instead of chasing them.
                if (abs(target[index] - channels[channel]) > 2f) target[index] = channels[channel].toFloat()
            }
        }
        schedule()
    }

    fun bars(values: ReadableMap?) {
        if (values == null) return
        val density = resources.displayMetrics.density
        val names = arrayOf("top", "bottom", "left", "right")
        // Recover exact physical pixel boundaries after the dp bridge round trip.
        for (i in names.indices) bounds[i] = (values.getDouble(names[i]) * density).roundToInt().coerceAtLeast(0).toFloat()
        geometry()
    }

    private fun schedule() {
        if (!queued && isAttachedToWindow && windowVisibility == VISIBLE) {
            queued = true
            Choreographer.getInstance().postFrameCallback(this)
        }
    }

    override fun doFrame(time: Long) {
        queued = false
        val elapsedMs = if (lastFrame == 0L) 16.7f else ((time - lastFrame) / 1_000_000f).coerceIn(0f, 64f)
        lastFrame = time
        // Time-based smoothing remains continuous across interruptions and scene cuts.
        val weight = (1.0 - exp(-elapsedMs / 220.0)).toFloat()
        var moving = false
        for (i in current.indices) {
            val difference = target[i] - current[i]
            if (abs(difference) > 0.6f) {
                current[i] += difference * weight
                moving = true
            } else current[i] = target[i]
        }
        invalidate()
        if (moving) schedule() else lastFrame = 0L
    }

    override fun onAttachedToWindow() { super.onAttachedToWindow(); schedule() }
    override fun onDetachedFromWindow() {
        Choreographer.getInstance().removeFrameCallback(this)
        queued = false
        lastFrame = 0L
        super.onDetachedFromWindow()
    }
    override fun onWindowVisibilityChanged(visibility: Int) {
        super.onWindowVisibilityChanged(visibility)
        if (visibility == VISIBLE) schedule() else {
            Choreographer.getInstance().removeFrameCallback(this)
            queued = false
            lastFrame = 0L
        }
    }
    override fun onSizeChanged(w: Int, h: Int, oldW: Int, oldH: Int) { geometry() }

    private fun geometry() {
        val w = width.toFloat(); val h = height.toFloat()
        rectangles[0].set(0f, 0f, w, bounds[0].coerceAtMost(h / 2))
        rectangles[1].set(0f, h - bounds[1].coerceAtMost(h / 2), w, h)
        rectangles[2].set(0f, 0f, bounds[2].coerceAtMost(w / 2), h)
        rectangles[3].set(w - bounds[3].coerceAtMost(w / 2), 0f, w, h)
        for (i in 0..3) {
            val r = rectangles[i]
            if (r.isEmpty) continue
            val horizontal = i >= 2
            val start = if (i == 0 || i == 2) Color.BLACK else Color.TRANSPARENT
            val end = if (i == 0 || i == 2) Color.TRANSPARENT else Color.BLACK
            fades[i].shader = LinearGradient(r.left, r.top, if (horizontal) r.right else r.left,
                if (horizontal) r.top else r.bottom, start, end, Shader.TileMode.CLAMP)
        }
        shadersDirty = true
        invalidate()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)
        if (strength <= 0f) return
        var changed = shadersDirty
        for (i in 0..3) {
            // Blend into black in RGB, avoiding independently fading layers.
            drawnColors[i] = Color.rgb((current[i * 3] * strength).toInt(),
                (current[i * 3 + 1] * strength).toInt(), (current[i * 3 + 2] * strength).toInt())
            if (drawnColors[i] != cachedColors[i]) changed = true
        }
        for (i in 0..3) {
            val r = rectangles[i]
            if (r.isEmpty) continue
            if (changed) {
                val first = if (i == 1) 2 else if (i == 3) 1 else 0
                val second = if (i == 0) 1 else if (i == 2) 2 else 3
                paints[i].shader = LinearGradient(r.left, r.top, if (i < 2) r.right else r.left,
                    if (i < 2) r.top else r.bottom, drawnColors[first], drawnColors[second], Shader.TileMode.CLAMP)
            }
            canvas.drawRect(r, paints[i])
            canvas.drawRect(r, fades[i])
        }
        drawnColors.copyInto(cachedColors)
        shadersDirty = false
    }
}

class AmbientGlowManager : SimpleViewManager<AmbientGlowView>() {
    override fun getName() = "VegaAmbientGlow"
    override fun createViewInstance(context: ThemedReactContext) = AmbientGlowView(context)
    @ReactProp(name = "palette") fun palette(view: AmbientGlowView, colors: ReadableArray?) { view.palette(colors) }
    @ReactProp(name = "bars") fun bars(view: AmbientGlowView, bars: ReadableMap?) { view.bars(bars) }
    @ReactProp(name = "intensity", defaultFloat = 0.35f) fun intensity(view: AmbientGlowView, intensity: Float) { view.strength = intensity }
    override fun onDropViewInstance(view: AmbientGlowView) {
        view.visibility = View.GONE
        super.onDropViewInstance(view)
    }
}

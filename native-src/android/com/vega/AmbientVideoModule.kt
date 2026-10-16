package com.vega

import android.graphics.Bitmap
import android.graphics.Color
import android.os.Build
import android.media.MediaFormat
import androidx.media3.common.C
import androidx.media3.common.Format
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.exoplayer.video.VideoFrameMetadataListener
import androidx.media3.ui.PlayerView
import android.os.SystemClock
import android.os.Handler
import android.os.Looper
import android.view.PixelCopy
import android.view.SurfaceView
import android.view.TextureView
import android.view.View
import android.view.ViewGroup
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.ViewManager

/** Samples the existing decoded surface; never opens a decoder, file or URL. */
class AmbientVideoModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    override fun getName() = "AmbientVideo"
    private var lastHdrDiagnostic = ""
    private val hdrObservers = java.util.WeakHashMap<ExoPlayer, HdrOutputObserver>()

    private data class OutputColor(val format: Format, val transfer: Int?, val space: Int?, val maxCllNits: Int?)

    private companion object {
        // Android's 25-byte CTA-861.3 Type 1 descriptor stores MaxCLL as
        // an unsigned little-endian short at byte 21. Zero means unknown.
        fun readMaxCll(data: java.nio.ByteBuffer?): Int? {
            if (data == null || data.remaining() != 25) return null
            val start = data.position()
            if (data.get(start).toInt() != 0) return null
            val nits = (data.get(start + 21).toInt() and 255) or
                ((data.get(start + 22).toInt() and 255) shl 8)
            return nits.takeIf { it in 1..10000 }
        }
    }

    private class HdrOutputObserver : VideoFrameMetadataListener, Player.Listener {
        @Volatile var output: OutputColor? = null
        private var lastMediaFormat: MediaFormat? = null
        override fun onVideoFrameAboutToBeRendered(timeUs: Long, releaseNs: Long, format: Format, mediaFormat: MediaFormat?) {
            // This callback runs on the playback thread. Read only on format changes;
            // never send per-frame events or allocate per-frame palettes/bitmaps.
            if (mediaFormat === lastMediaFormat && output?.format === format) return
            lastMediaFormat = mediaFormat
            fun number(key: String): Int? = try {
                if (mediaFormat?.containsKey(key) == true) mediaFormat.getInteger(key) else null
            } catch (_: Exception) { null }
            val maxCll = try {
                readMaxCll(mediaFormat?.getByteBuffer(MediaFormat.KEY_HDR_STATIC_INFO))
            } catch (_: Exception) { null } ?: readMaxCll(format.colorInfo?.hdrStaticInfo?.let { java.nio.ByteBuffer.wrap(it) })
            output = OutputColor(format, number(MediaFormat.KEY_COLOR_TRANSFER), number(MediaFormat.KEY_COLOR_STANDARD), maxCll)
        }
        override fun onMediaItemTransition(mediaItem: MediaItem?, reason: Int) { output = null }
        override fun onPlaybackStateChanged(state: Int) {
            if (state == Player.STATE_IDLE || state == Player.STATE_ENDED) output = null
        }
    }

    override fun invalidate() {
        UiThreadUtil.runOnUiThread {
            hdrObservers.forEach { (player, observer) ->
                player.clearVideoFrameMetadataListener(observer)
                player.removeListener(observer)
            }
            hdrObservers.clear()
        }
        super.invalidate()
    }

    private fun findPlayerView(view: View?): PlayerView? {
        if (view is PlayerView) return view
        if (view is ViewGroup) for (i in 0 until view.childCount) {
            findPlayerView(view.getChildAt(i))?.let { return it }
        }
        return null
    }

    @ReactMethod
    fun hdrStatus(reactTag: Int, promise: Promise) {
        UiThreadUtil.runOnUiThread {
            try {
                val root = UIManagerHelper.getUIManagerForReactTag(reactApplicationContext, reactTag)?.resolveView(reactTag)
                val playerView = findPlayerView(root)
                val player = playerView?.player as? ExoPlayer
                val format = player?.videoFormat
                val observer = player?.let {
                    hdrObservers.getOrPut(it) {
                        HdrOutputObserver().also { observer ->
                            it.addListener(observer)
                            it.setVideoFrameMetadataListener(observer)
                        }
                    }
                }
                val output = observer?.output?.takeIf { it.format == format }
                val color = format?.colorInfo
                val outputHdr = output?.transfer == C.COLOR_TRANSFER_ST2084 || output?.transfer == C.COLOR_TRANSFER_HLG
                // Prefer the actual decoder output. Explicit SDR output overrides
                // HDR input metadata (for example, decoder tone mapping).
                val transfer = output?.transfer ?: color?.colorTransfer
                val colorSpace = output?.space ?: color?.colorSpace
                val display = playerView?.display
                val surface = playerView?.videoSurfaceView
                val diagnostic = "playing=${player?.isPlaying} mime=${format?.sampleMimeType} inputColor=$color outputTransfer=${output?.transfer} outputSpace=${output?.space} ratio=${if (Build.VERSION.SDK_INT >= 34) display?.hdrSdrRatio else null}"
                if (diagnostic != lastHdrDiagnostic) {
                    lastHdrDiagnostic = diagnostic
                    android.util.Log.d("VegaHDR", diagnostic)
                }
                // Only advertise HDR when Android confirms active HDR headroom.
                // Older devices without this signal remain unbadged rather than guessed.
                if (Build.VERSION.SDK_INT < 34 || display == null || !display.isHdrSdrRatioAvailable ||
                    display.hdrSdrRatio <= 1.01f || surface !is SurfaceView || !surface.isShown ||
                    !surface.holder.surface.isValid || player?.playbackState != Player.STATE_READY || format == null) {
                    promise.resolve(null)
                    return@runOnUiThread
                }
                val supported = display.hdrCapabilities.supportedHdrTypes
                val dolby = format.sampleMimeType == "video/dolby-vision"
                val pq = transfer == C.COLOR_TRANSFER_ST2084
                val hlg = transfer == C.COLOR_TRANSFER_HLG
                val explicitSdrOutput = output?.transfer != null && !outputHdr
                val compatible = when {
                    explicitSdrOutput && !dolby -> false
                    dolby -> supported.contains(1)
                    outputHdr -> supported.isNotEmpty()
                    hlg -> supported.contains(3)
                    pq -> supported.contains(2) || supported.contains(4)
                    else -> false
                }
                if (!compatible) { promise.resolve(null); return@runOnUiThread }
                promise.resolve(Arguments.createMap().apply {
                    putString("type", if (dolby) "Dolby Vision" else if (hlg) "HLG" else "HDR")
                    putString("codec", format.sampleMimeType ?: "Unknown")
                    putString("resolution", "${format.width} × ${format.height}")
                    putString("transfer", if (hlg) "HLG" else if (pq) "PQ (ST 2084)" else "Dolby Vision")
                    putString("colorSpace", when (colorSpace) {
                        C.COLOR_SPACE_BT2020 -> "BT.2020"
                        C.COLOR_SPACE_BT709 -> "BT.709"
                        C.COLOR_SPACE_BT601 -> "BT.601"
                        else -> if (dolby) "Managed by Dolby Vision decoder" else "Not reported"
                    })
                    putDouble("headroom", display.hdrSdrRatio.toDouble())
                    val maxCll = if (output != null) output.maxCllNits else
                        readMaxCll(color?.hdrStaticInfo?.let { java.nio.ByteBuffer.wrap(it) })
                    maxCll?.let { putInt("maxCllNits", it) }
                    putString("displayTypes", supported.toList().mapNotNull { when (it) {
                        1 -> "Dolby Vision"; 2 -> "HDR10"; 3 -> "HLG"; 4 -> "HDR10+"; else -> null
                    } }.joinToString(", "))
                })
            } catch (_: Exception) { promise.resolve(null) }
        }
    }

    @ReactMethod
    fun sample(reactTag: Int, promise: Promise) {
        UiThreadUtil.runOnUiThread {
            var bitmap: Bitmap? = null
            try {
                val root = UIManagerHelper.getUIManagerForReactTag(reactApplicationContext, reactTag)?.resolveView(reactTag)
                val texture = findSurface(root)
                if (root == null || texture == null || !texture.isShown || texture.width <= 0 || texture.height <= 0 ||
                    (texture is TextureView && !texture.isAvailable) ||
                    (texture is SurfaceView && !texture.holder.surface.isValid)) {
                    promise.resolve(null)
                    return@runOnUiThread
                }
                // Use the actual fitted view bounds, including pixel-aspect-ratio
                // corrections, rather than trusting the file's encoded dimensions.
                var child: View = texture
                var left = 0
                var top = 0
                while (child !== root) {
                    val parent = child.parent as? View ?: break
                    left += child.left - parent.scrollX
                    top += child.top - parent.scrollY
                    child = parent
                }
                if (child !== root) {
                    promise.resolve(null)
                    return@runOnUiThread
                }
                val density = reactApplicationContext.resources.displayMetrics.density.toDouble()
                val right = (root.width - left - texture.width).coerceAtLeast(0)
                val bottom = (root.height - top - texture.height).coerceAtLeast(0)
                val bars = Arguments.createMap().apply {
                    putDouble("left", left.coerceAtLeast(0) / density)
                    putDouble("right", right.coerceAtLeast(0) / density)
                    putDouble("top", top.coerceAtLeast(0) / density)
                    putDouble("bottom", bottom.coerceAtLeast(0) / density)
                }
                if (left <= 0 && right <= 0 && top <= 0 && bottom <= 0) {
                    promise.resolve(Arguments.createMap().apply { putMap("bars", bars) })
                    return@runOnUiThread
                }
                val sample = Bitmap.createBitmap(16, 12, Bitmap.Config.ARGB_8888)
                bitmap = sample
                fun finish(result: Int, blockingMs: Double) {
                    try {
                        if (result != PixelCopy.SUCCESS) {
                            promise.resolve(null)
                            return
                        }
                        val colors = Arguments.createArray()
                        for (row in 0..1) for (column in 0..1) {
                            var red = 0; var green = 0; var blue = 0
                            for (y in row * 6 until row * 6 + 6) for (x in column * 8 until column * 8 + 8) {
                                val pixel = sample.getPixel(x, y)
                                red += Color.red(pixel); green += Color.green(pixel); blue += Color.blue(pixel)
                            }
                            colors.pushString(String.format(java.util.Locale.US, "#%02x%02x%02x", red / 48, green / 48, blue / 48))
                        }
                        promise.resolve(Arguments.createMap().apply {
                            putArray("colors", colors)
                            putMap("bars", bars)
                            // PixelCopy waits asynchronously; budget only the blocking TextureView fallback.
                            putDouble("durationMs", blockingMs)
                        })
                    } catch (_: Exception) {
                        promise.resolve(null)
                    } finally {
                        sample.recycle()
                    }
                }
                if (texture is SurfaceView) {
                    PixelCopy.request(texture, sample, { result -> finish(result, 0.0) }, Handler(Looper.getMainLooper()))
                } else if (texture is TextureView) {
                    val start = SystemClock.elapsedRealtimeNanos()
                    texture.getBitmap(sample)
                    finish(PixelCopy.SUCCESS, (SystemClock.elapsedRealtimeNanos() - start) / 1_000_000.0)
                }
            } catch (_: Exception) {
                bitmap?.let { if (!it.isRecycled) it.recycle() }
                // A disappearing view or protected/unavailable texture simply has no glow.
                promise.resolve(null)
            }
        }
    }

    private fun findSurface(view: View?): View? {
        if (view is SurfaceView || view is TextureView) return view
        if (view is ViewGroup) for (index in 0 until view.childCount) {
            findSurface(view.getChildAt(index))?.let { return it }
        }
        return null
    }
}

class AmbientVideoPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> = listOf(AmbientVideoModule(reactContext))
    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = listOf(AmbientGlowManager())
}

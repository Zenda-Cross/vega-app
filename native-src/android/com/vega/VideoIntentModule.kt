package com.vega

import android.app.Activity
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.provider.OpenableColumns
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.uimanager.ViewManager

class VideoIntentModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context), ActivityEventListener {
    private val prefs = context.getSharedPreferences("video-player-intents", Context.MODE_PRIVATE)
    private var listeners = 0
    private var pending: WritableMap? = null

    init { context.addActivityEventListener(this) }
    override fun getName() = "VegaVideoIntent"

    @ReactMethod
    fun setEnabled(enabled: Boolean, promise: Promise) {
        try {
            context.packageManager.setComponentEnabledSetting(
                ComponentName(context.packageName, "${context.packageName}.VideoPlayer"),
                if (enabled) PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                else PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
                PackageManager.DONT_KILL_APP,
            )
            prefs.edit().putBoolean("enabled", enabled).apply()
            if (!enabled) pending = null
            promise.resolve(null)
        } catch (error: Exception) { promise.reject("VIDEO_PLAYER_SETTING", error) }
    }

    @ReactMethod
    fun getInitialVideo(promise: Promise) {
        val intent = context.currentActivity?.intent
        val initial = if (intent != null &&
            intent.flags and Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY == 0
        ) consume(intent) else null
        promise.resolve(pending ?: initial)
        pending = null
    }

    @ReactMethod
    fun addListener(eventName: String) { listeners++ }
    @ReactMethod
    fun removeListeners(count: Int) { listeners = (listeners - count).coerceAtLeast(0) }

    override fun onNewIntent(intent: Intent) {
        val payload = consume(intent) ?: return
        if (listeners > 0) {
            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onVegaOpenVideo", payload)
        } else pending = payload
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {}

    @Suppress("DEPRECATION")
    private fun consume(intent: Intent): WritableMap? {
        if (intent.action != Intent.ACTION_VIEW && intent.action != Intent.ACTION_SEND) return null
        val uri: Uri = (if (intent.action == Intent.ACTION_SEND)
            (intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM) ?: intent.clipData?.getItemAt(0)?.uri)
        else intent.data) ?: return null
        if (uri.scheme !in listOf("content", "file", "http", "https")) return null
        val mime = intent.type.orEmpty().lowercase()
        if (!mime.startsWith("video/") && mime !in listOf(
                "application/x-mpegurl", "application/vnd.apple.mpegurl", "application/dash+xml"
            ) && !Regex("\\.(mkv|mp4|m4v|avi|mov|webm|ts|m2ts|mpeg|mpg|3gp|wmv|flv|m3u8|mpd)$", RegexOption.IGNORE_CASE)
                .containsMatchIn(uri.path.orEmpty())) return null
        intent.action = null // Consume once, including across JS reloads.
        if (!prefs.getBoolean("enabled", true)) return null
        if (uri.scheme == "content" && intent.flags and Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION != 0) {
            try { context.contentResolver.takePersistableUriPermission(uri, Intent.FLAG_GRANT_READ_URI_PERMISSION) }
            catch (_: SecurityException) { /* The transient grant still allows playback. */ }
        }
        var name = intent.getStringExtra(Intent.EXTRA_TITLE)?.take(512)
        if (name.isNullOrBlank() && uri.scheme == "content") {
            try {
                context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
                    if (cursor.moveToFirst()) name = cursor.getString(0)
                }
            } catch (_: Exception) { /* A display name is optional. */ }
        }
        return Arguments.createMap().apply {
            putString("uri", uri.toString())
            putString("mimeType", mime)
            putString("title", name ?: uri.lastPathSegment ?: "Video")
        }
    }
}

class VideoIntentPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> =
        listOf(VideoIntentModule(reactContext))
    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}

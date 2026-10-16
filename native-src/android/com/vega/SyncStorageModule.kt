package com.vega

import android.net.Uri
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.os.ParcelFileDescriptor.AutoCloseOutputStream
import java.util.UUID
import java.util.concurrent.Executors

/** Device identity survives updates and is not copied with Android Auto Backup. */
class SyncStorageModule(private val context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
    private val writer = Executors.newSingleThreadExecutor()
    override fun getName() = "VegaSyncStorage"

    override fun getConstants(): Map<String, Any> {
        val androidId = Settings.Secure.getString(context.contentResolver, Settings.Secure.ANDROID_ID)
        if (androidId.isNullOrBlank()) return emptyMap()
        // Publish a namespaced UUID rather than the underlying Android identifier.
        val id = UUID.nameUUIDFromBytes(("vega-sync:" + context.packageName + ":" + androidId).toByteArray(Charsets.UTF_8)).toString()
        return mapOf("deviceId" to id)
    }

    @ReactMethod
    fun writeManifest(uri: String, content: String, promise: Promise) {
        writer.execute {
            try {
                val bytes = content.toByteArray(Charsets.UTF_8)
                val descriptor = context.contentResolver.openFileDescriptor(Uri.parse(uri), "rwt")
                    ?: throw java.io.IOException("Unable to open sync document")
                AutoCloseOutputStream(descriptor).use { output ->
                    // SAF's plain 'w' mode need not truncate, leaving old JSON at the end.
                    output.channel.truncate(0)
                    output.write(bytes)
                    output.flush()
                    output.channel.truncate(bytes.size.toLong())
                }
                promise.resolve(null)
            } catch (error: Exception) {
                promise.reject("SYNC_WRITE_FAILED", "Unable to replace sync manifest", error)
            }
        }
    }

    override fun invalidate() {
        writer.shutdown()
        super.invalidate()
    }
}

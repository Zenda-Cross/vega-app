package com.vega

import android.app.Activity
import android.content.Intent
import com.facebook.react.bridge.*

class BackupExportModule(private val context: ReactApplicationContext) :
    ReactContextBaseJavaModule(context), ActivityEventListener {
    private var pending: Pair<Promise, String>? = null

    init { context.addActivityEventListener(this) }
    override fun getName() = "BackupExport"

    @ReactMethod
    fun save(fileName: String, content: String, promise: Promise) {
        context.runOnUiQueueThread {
            val activity = context.currentActivity
            if (activity == null || pending != null) {
                promise.reject("EXPORT_UNAVAILABLE", "The backup save dialog is unavailable.")
                return@runOnUiQueueThread
            }
            pending = promise to content
            try {
                activity.startActivityForResult(Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "application/json"
                    putExtra(Intent.EXTRA_TITLE, fileName)
                    addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
                }, REQUEST_SAVE)
            } catch (error: Exception) {
                pending = null
                promise.reject("EXPORT_PICKER_FAILED", error)
            }
        }
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode != REQUEST_SAVE) return
        val (promise, content) = pending ?: return
        pending = null
        if (resultCode != Activity.RESULT_OK) {
            promise.resolve(false)
            return
        }
        val uri = data?.data
        if (uri == null) {
            promise.reject("EXPORT_NO_FILE", "No backup destination was returned.")
            return
        }
        Thread {
            try {
                val output = context.contentResolver.openOutputStream(uri, "wt")
                    ?: error("Cannot open the selected backup file.")
                output.use { it.write(content.toByteArray(Charsets.UTF_8)) }
                promise.resolve(true)
            } catch (error: Exception) {
                promise.reject("EXPORT_WRITE_FAILED", error)
            }
        }.start()
    }

    override fun onNewIntent(intent: Intent) {}

    override fun invalidate() {
        context.removeActivityEventListener(this)
        pending?.first?.reject("EXPORT_CANCELLED", "Backup export was interrupted.")
        pending = null
        super.invalidate()
    }

    companion object { private const val REQUEST_SAVE = 48723 }
}

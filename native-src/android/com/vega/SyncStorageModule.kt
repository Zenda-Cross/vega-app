package com.vega

import android.net.Uri
import android.provider.Settings
import android.provider.DocumentsContract
import com.facebook.react.bridge.Arguments
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
    fun listDirectory(uri: String, promise: Promise) {
        writer.execute {
            try {
                val parent = Uri.parse(uri)
                // Tree URIs and nested document URIs can have different ids.
                // DocumentFile.fromTreeUri would list the tree root for both.
                val id = if (DocumentsContract.isDocumentUri(context, parent)) {
                    DocumentsContract.getDocumentId(parent)
                } else {
                    DocumentsContract.getTreeDocumentId(parent)
                }
                val children = DocumentsContract.buildChildDocumentsUriUsingTree(parent, id)
                val result = Arguments.createArray()
                val columns = arrayOf(
                    DocumentsContract.Document.COLUMN_DOCUMENT_ID,
                    DocumentsContract.Document.COLUMN_DISPLAY_NAME,
                    DocumentsContract.Document.COLUMN_MIME_TYPE,
                )
                val cursor = context.contentResolver.query(children, columns, null, null, null)
                    ?: throw java.io.IOException("Unable to list sync directory")
                cursor.use {
                    // Some cloud providers return an incomplete listing while loading.
                    // It must never be mistaken for an absent directory or manifest.
                    if (it.extras.getBoolean(DocumentsContract.EXTRA_LOADING, false)) {
                        throw java.io.IOException("Sync directory is still loading; retry later")
                    }
                    while (it.moveToNext()) {
                        val entry = Arguments.createMap()
                        entry.putString("uri", DocumentsContract.buildDocumentUriUsingTree(parent, it.getString(0)).toString())
                        entry.putString("name", it.getString(1))
                        entry.putBoolean("isDirectory", it.getString(2) == DocumentsContract.Document.MIME_TYPE_DIR)
                        result.pushMap(entry)
                    }
                }
                promise.resolve(result)
            } catch (error: Exception) {
                promise.reject("SYNC_LIST_FAILED", "Unable to read sync directory", error)
            }
        }
    }

    @ReactMethod
    fun createDocument(uri: String, name: String, directory: Boolean, promise: Promise) {
        writer.execute {
            try {
                val parent = Uri.parse(uri)
                val id = if (DocumentsContract.isDocumentUri(context, parent)) {
                    DocumentsContract.getDocumentId(parent)
                } else {
                    DocumentsContract.getTreeDocumentId(parent)
                }
                val document = DocumentsContract.buildDocumentUriUsingTree(parent, id)
                val mime = if (directory) DocumentsContract.Document.MIME_TYPE_DIR else "application/json"
                val created = DocumentsContract.createDocument(context.contentResolver, document, mime, name)
                    ?: throw java.io.IOException("Unable to create sync document")
                promise.resolve(created.toString())
            } catch (error: Exception) {
                promise.reject("SYNC_CREATE_FAILED", "Unable to create sync document", error)
            }
        }
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

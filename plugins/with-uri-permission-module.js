const fs = require('fs');
const path = require('path');
const {withDangerousMod, withMainApplication} = require('expo/config-plugins');

const URI_PERMISSION_MODULE_SOURCE = packageName => `package ${packageName}

import android.content.Intent
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.ReactPackage
import com.facebook.react.uimanager.ViewManager
import android.net.Uri

// Lets JS ask Android to persist read access to a document picked via the
// Storage Access Framework (ACTION_OPEN_DOCUMENT), so a content:// uri
// handed back by expo-document-picker (with copyToCacheDirectory: false)
// stays readable after the app process is killed and restarted, without
// duplicating the underlying file. Without this call, the grant Android
// hands out for a freshly-picked document is not guaranteed to survive
// past the current process lifetime.
class UriPermissionModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
  override fun getName(): String = "UriPermissionModule"

  @ReactMethod
  fun listDirectory(uriString: String, promise: Promise) {
    java.util.concurrent.Executors.newSingleThreadExecutor().let { executor ->
      executor.execute {
        try {
          val uri = Uri.parse(uriString)
          val documentId = if (uri.path?.contains("/document/") == true)
            android.provider.DocumentsContract.getDocumentId(uri)
          else android.provider.DocumentsContract.getTreeDocumentId(uri)
          val childrenUri = android.provider.DocumentsContract.buildChildDocumentsUriUsingTree(uri, documentId)
          val result = com.facebook.react.bridge.Arguments.createArray()
          val columns = arrayOf(
            android.provider.DocumentsContract.Document.COLUMN_DOCUMENT_ID,
            android.provider.DocumentsContract.Document.COLUMN_DISPLAY_NAME,
            android.provider.DocumentsContract.Document.COLUMN_MIME_TYPE
          )
          val cursor = reactContext.contentResolver.query(childrenUri, columns, null, null, null)
            ?: throw IllegalStateException("Cannot read this folder")
          cursor.use {
            while (it.moveToNext()) {
              val entry = com.facebook.react.bridge.Arguments.createMap()
              entry.putString("uri", android.provider.DocumentsContract.buildDocumentUriUsingTree(uri, it.getString(0)).toString())
              entry.putString("name", it.getString(1) ?: "")
              entry.putBoolean("directory", it.getString(2) == android.provider.DocumentsContract.Document.MIME_TYPE_DIR)
              result.pushMap(entry)
            }
          }
          promise.resolve(result)
        } catch (error: Exception) {
          promise.reject("LOCAL_FOLDER_ACCESS_FAILED", "Cannot read folder. Select it again to restore access.", error)
        } finally {
          executor.shutdown()
        }
      }
    }
  }

  @ReactMethod
  fun takePersistableUriPermission(uriString: String, promise: Promise) {
    try {
      val uri = Uri.parse(uriString)
      val flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
      reactContext.contentResolver.takePersistableUriPermission(uri, flags)
      promise.resolve(true)
    } catch (error: Exception) {
      // Non-fatal: some uris (e.g. already-persisted, or from providers
      // that don't support persistable grants) will throw here. The
      // caller should treat this as "couldn't guarantee persistence"
      // rather than a hard failure.
      promise.reject("TAKE_PERSISTABLE_URI_PERMISSION_FAILED", error.message, error)
    }
  }

  @ReactMethod
  fun releasePersistableUriPermission(uriString: String, promise: Promise) {
    try {
      val uri = Uri.parse(uriString)
      val flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
      reactContext.contentResolver.releasePersistableUriPermission(uri, flags)
      promise.resolve(true)
    } catch (error: Exception) {
      // Already released, or never held — safe to ignore from JS's
      // perspective, so resolve false instead of rejecting.
      promise.resolve(false)
    }
  }

  @ReactMethod
  fun getPersistedUriPermissions(promise: Promise) {
    try {
      val uris = reactContext.contentResolver.persistedUriPermissions.map { it.uri.toString() }
      promise.resolve(com.facebook.react.bridge.Arguments.fromList(uris))
    } catch (error: Exception) {
      promise.reject("GET_PERSISTED_URI_PERMISSIONS_FAILED", error.message, error)
    }
  }
}

class UriPermissionPackage : ReactPackage {
  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(UriPermissionModule(reactContext))
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}
`;

function withUriPermissionModule(config) {
  config = withDangerousMod(config, [
    'android',
    async cfg => {
      const projectRoot = cfg.modRequest.projectRoot;
      const packageName = cfg.android?.package || 'com.vega';
      const packagePath = packageName.replace(/\./g, '/');
      const targetFile = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main',
        'java',
        packagePath,
        'UriPermissionModule.kt',
      );

      fs.mkdirSync(path.dirname(targetFile), {recursive: true});
      fs.writeFileSync(
        targetFile,
        URI_PERMISSION_MODULE_SOURCE(packageName),
        'utf8',
      );

      return cfg;
    },
  ]);

  return withMainApplication(config, cfg => {
    const currentContents = cfg.modResults.contents;

    if (!currentContents.includes('add(UriPermissionPackage())')) {
      const updatedContents = currentContents.replace(
        /PackageList\(this\)\.packages\.apply \{\n/,
        match => `${match}              add(UriPermissionPackage())\n`,
      );

      cfg.modResults.contents = updatedContents;
    }

    return cfg;
  });
}

module.exports = withUriPermissionModule;

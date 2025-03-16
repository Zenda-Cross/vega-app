# TV-specific ProGuard rules

# Keep Leanback classes
-keep class androidx.leanback.** { *; }
-keep interface androidx.leanback.** { *; }

# Keep ExoPlayer classes
-keep class com.google.android.exoplayer2.** { *; }
-keep interface com.google.android.exoplayer2.** { *; }

# Keep TV Provider classes
-keep class androidx.tvprovider.** { *; }
-keep interface androidx.tvprovider.** { *; }

# Keep model classes
-keep class com.vega.tv.models.** { *; }
-keep class com.vega.shared.models.** { *; }

# Keep React Native TV specific classes
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

# Keep MMKV classes
-keep class com.tencent.mmkv.** { *; }

# Keep Retrofit and OkHttp classes
-keepattributes Signature
-keepattributes *Annotation*
-keep class retrofit2.** { *; }
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# Keep Gson classes
-keep class com.google.gson.** { *; }
-keepattributes Signature
-keepattributes *Annotation*
-dontwarn sun.misc.**
-keep class * implements com.google.gson.TypeAdapter
-keep class * implements com.google.gson.TypeAdapterFactory
-keep class * implements com.google.gson.JsonSerializer
-keep class * implements com.google.gson.JsonDeserializer

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep TV-specific activities and fragments
-keep class com.vega.tv.ui.** { *; }
-keep class com.vega.tv.fragments.** { *; }
-keep class com.vega.tv.presenters.** { *; }

# Keep performance optimization classes
-keep class com.vega.tv.performance.** { *; }
-keep class com.vega.tv.utils.** { *; }
-keep class com.vega.tv.network.** { *; }
-keep class com.vega.tv.data.** { *; }

# Keep JavaScript interface methods
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Parcelable implementations
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable implementations
-keepnames class * implements java.io.Serializable
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    !private <fields>;
    !private <methods>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Optimization settings
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification

# Remove logging for production
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Keep R classes
-keepclassmembers class **.R$* {
    public static <fields>;
}

# Keep ExoPlayer TV-specific classes
-keep class com.google.android.exoplayer2.ext.leanback.** { *; }
-keep interface com.google.android.exoplayer2.ext.leanback.** { *; }

# Keep TV-specific React Native classes
-keep class com.facebook.react.bridge.ReadableArray { *; }
-keep class com.facebook.react.bridge.ReadableMap { *; }
-keep class com.facebook.react.devsupport.** { *; }

# Keep TV-specific activities and fragments
-keep public class * extends androidx.leanback.app.BrowseFragment
-keep public class * extends androidx.leanback.app.DetailsFragment
-keep public class * extends androidx.leanback.app.PlaybackFragment
-keep public class * extends androidx.leanback.app.SearchFragment
-keep public class * extends androidx.leanback.app.GuidedStepFragment
-keep public class * extends androidx.leanback.app.RowsFragment
-keep public class * extends androidx.leanback.app.VerticalGridFragment

# Keep TV-specific presenters
-keep public class * extends androidx.leanback.widget.Presenter
-keep public class * extends androidx.leanback.widget.RowPresenter
-keep public class * extends androidx.leanback.widget.ItemBridgeAdapter

# Keep TV-specific views
-keep public class * extends androidx.leanback.widget.BaseCardView
-keep public class * extends androidx.leanback.widget.HorizontalGridView
-keep public class * extends androidx.leanback.widget.VerticalGridView
-keep public class * extends androidx.leanback.widget.BrowseFrameLayout

# Keep TV-specific listeners
-keep public class * implements androidx.leanback.widget.OnItemViewClickedListener
-keep public class * implements androidx.leanback.widget.OnItemViewSelectedListener

# Keep TV-specific model classes
-keep class com.vega.tv.models.** { *; }

# Keep TV-specific resources
-keepclassmembers class **.R$* {
    public static <fields>;
}

# Keep TV-specific manifest attributes
-keepattributes *Annotation*

# Keep TV-specific native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep TV-specific JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep TV-specific Parcelable implementations
-keepclassmembers class * implements android.os.Parcelable {
    static ** CREATOR;
}

# Keep TV-specific Serializable implementations
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    !static !transient <fields>;
    !private <fields>;
    !private <methods>;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Optimization specific to TV
-optimizations !code/simplification/arithmetic,!code/simplification/cast,!field/*,!class/merging/*
-optimizationpasses 5
-allowaccessmodification

# Remove logging for production TV builds
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}

# Keep TV-specific media session classes
-keep class android.support.v4.media.** { *; }
-keep class android.media.session.** { *; }

# Keep TV-specific picture-in-picture classes
-keep class android.app.PictureInPictureParams$Builder { *; }
-keep class android.app.PictureInPictureParams { *; }
-keep class android.util.Rational { *; }

# Keep TV-specific voice search classes
-keep class android.app.SearchManager { *; }
-keep class android.app.SearchableInfo { *; }

# Keep TV-specific gamepad/remote control classes
-keep class android.view.KeyEvent { *; }
-keep class android.view.InputDevice { *; }
-keep class android.view.MotionEvent { *; }

# Keep TV-specific DRM classes
-keep class com.google.android.exoplayer2.drm.** { *; }

# Keep TV-specific media codec classes
-keep class android.media.MediaCodec { *; }
-keep class android.media.MediaCodecInfo { *; }
-keep class android.media.MediaCodecList { *; }

# Keep TV-specific HDR classes
-keep class android.view.Display$HdrCapabilities { *; }
-keep class android.view.SurfaceControl$Transaction { *; }

# Keep TV-specific audio classes
-keep class android.media.AudioManager { *; }
-keep class android.media.AudioAttributes { *; }
-keep class android.media.AudioFormat { *; }
-keep class android.media.AudioTrack { *; }

# Keep TV-specific HDMI-CEC classes
-keep class android.hardware.hdmi.** { *; }

# Keep TV-specific TIF classes (TV Input Framework)
-keep class android.media.tv.** { *; } 
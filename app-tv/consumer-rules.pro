# Consumer rules for the TV app module
# These rules will be applied to any app that depends on this module

# Keep AndroidX Leanback classes
-keep class androidx.leanback.** { *; }
-keep interface androidx.leanback.** { *; }

# Keep TV Provider classes
-keep class androidx.tvprovider.** { *; }
-keep interface androidx.tvprovider.** { *; }

# Keep ExoPlayer Leanback extension classes
-keep class com.google.android.exoplayer2.ext.leanback.** { *; }
-keep interface com.google.android.exoplayer2.ext.leanback.** { *; }

# Keep React Native TV-specific classes
-keep class com.facebook.react.uimanager.** { *; }
-keep class com.facebook.react.views.** { *; }

# Keep TV-specific model classes
-keep class com.vega.tv.models.** { *; }
-keep class com.vega.tv.api.** { *; }
-keep class com.vega.tv.repositories.** { *; }

# Keep Parcelable classes
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable classes
-keepnames class * implements java.io.Serializable 
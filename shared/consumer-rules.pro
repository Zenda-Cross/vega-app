# Consumer rules for the shared module
# These rules will be applied to any app that depends on this module

# Keep React Native classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep MMKV classes
-keep class com.tencent.mmkv.** { *; }

# Keep shared model classes
-keep class com.vega.shared.models.** { *; }
-keep class com.vega.shared.api.** { *; }
-keep class com.vega.shared.repositories.** { *; }

# Keep Retrofit and OkHttp classes
-keepattributes Signature
-keepattributes RuntimeVisibleAnnotations
-keep class retrofit2.** { *; }
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }
-dontwarn okhttp3.**
-dontwarn okio.**

# Keep Parcelable classes
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep Serializable classes
-keepnames class * implements java.io.Serializable 
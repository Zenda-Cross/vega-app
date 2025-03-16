package com.vega.tv.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.os.Build
import com.vega.tv.data.TvCacheManager
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.Cache
import okhttp3.CacheControl
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.Response
import java.io.File
import java.util.concurrent.TimeUnit

/**
 * Network optimizer for Android TV applications.
 * Provides optimized network configurations, caching strategies, and bandwidth management.
 */
class TvNetworkOptimizer(private val context: Context, private val cacheManager: TvCacheManager) {

    // Create a cache with 50MB size
    private val cacheSize = 50 * 1024 * 1024L // 50MB
    private val cacheDir = File(context.cacheDir, "http_cache")
    private val cache = Cache(cacheDir, cacheSize)

    // Create OkHttpClient with TV-optimized settings
    val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .cache(cache)
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(20, TimeUnit.SECONDS)
            .writeTimeout(20, TimeUnit.SECONDS)
            .addNetworkInterceptor(CacheInterceptor())
            .addInterceptor(OfflineInterceptor())
            .build()
    }

    /**
     * Check if the device is currently connected to the network
     * @return true if connected, false otherwise
     */
    fun isNetworkAvailable(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork ?: return false
            val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
            
            return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                   capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)
        } else {
            @Suppress("DEPRECATION")
            val networkInfo = connectivityManager.activeNetworkInfo
            @Suppress("DEPRECATION")
            return networkInfo != null && networkInfo.isConnected
        }
    }

    /**
     * Check if the device is connected to a metered network (e.g., mobile data)
     * @return true if on metered network, false otherwise
     */
    fun isOnMeteredNetwork(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork ?: return false
            val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
            
            return !capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED)
        } else {
            @Suppress("DEPRECATION")
            return connectivityManager.isActiveNetworkMetered
        }
    }

    /**
     * Check if the device is on a high-speed network
     * @return true if on high-speed network, false otherwise
     */
    fun isOnHighSpeedNetwork(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork ?: return false
            val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
            
            return capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                   capabilities.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
        } else {
            @Suppress("DEPRECATION")
            val networkInfo = connectivityManager.activeNetworkInfo
            @Suppress("DEPRECATION")
            return networkInfo != null && 
                   (networkInfo.type == ConnectivityManager.TYPE_WIFI || 
                    networkInfo.type == ConnectivityManager.TYPE_ETHERNET)
        }
    }

    /**
     * Get the recommended image quality based on network conditions
     * @return ImageQuality enum value
     */
    fun getRecommendedImageQuality(): ImageQuality {
        return when {
            !isNetworkAvailable() -> ImageQuality.LOW
            isOnMeteredNetwork() -> ImageQuality.MEDIUM
            isOnHighSpeedNetwork() -> ImageQuality.HIGH
            else -> ImageQuality.MEDIUM
        }
    }

    /**
     * Get the recommended video quality based on network conditions
     * @return VideoQuality enum value
     */
    fun getRecommendedVideoQuality(): VideoQuality {
        return when {
            !isNetworkAvailable() -> VideoQuality.SD
            isOnMeteredNetwork() -> VideoQuality.HD
            isOnHighSpeedNetwork() -> VideoQuality.UHD
            else -> VideoQuality.HD
        }
    }

    /**
     * Clear the network cache
     */
    suspend fun clearNetworkCache() = withContext(Dispatchers.IO) {
        try {
            cache.evictAll()
        } catch (e: Exception) {
            // Ignore errors
        }
    }

    /**
     * Network interceptor for caching responses
     */
    inner class CacheInterceptor : Interceptor {
        override fun intercept(chain: Interceptor.Chain): Response {
            val response = chain.proceed(chain.request())
            
            // Cache for 1 day
            val cacheControl = CacheControl.Builder()
                .maxAge(1, TimeUnit.DAYS)
                .build()
                
            return response.newBuilder()
                .removeHeader("Pragma")
                .removeHeader("Cache-Control")
                .header("Cache-Control", cacheControl.toString())
                .build()
        }
    }

    /**
     * Offline interceptor for using cached responses when offline
     */
    inner class OfflineInterceptor : Interceptor {
        override fun intercept(chain: Interceptor.Chain): Response {
            var request = chain.request()
            
            if (!isNetworkAvailable()) {
                // Use cached response for 7 days if offline
                val cacheControl = CacheControl.Builder()
                    .maxStale(7, TimeUnit.DAYS)
                    .build()
                    
                request = request.newBuilder()
                    .removeHeader("Pragma")
                    .removeHeader("Cache-Control")
                    .cacheControl(cacheControl)
                    .build()
            }
            
            return chain.proceed(request)
        }
    }

    /**
     * Image quality enum
     */
    enum class ImageQuality {
        LOW,    // 480p or lower
        MEDIUM, // 720p
        HIGH    // 1080p or higher
    }

    /**
     * Video quality enum
     */
    enum class VideoQuality {
        SD,  // 480p
        HD,  // 720p
        FHD, // 1080p
        UHD  // 4K
    }
} 
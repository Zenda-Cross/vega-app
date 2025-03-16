package com.vega.tv.data

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import android.util.Log
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import okhttp3.Cache
import okhttp3.CacheControl
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.io.File
import java.util.concurrent.TimeUnit

/**
 * TV-specific network client with optimizations for TV network requests.
 * Provides caching, timeout configuration, and bandwidth-aware request handling.
 */
class TvNetworkClient(private val context: Context) {
    
    private val TAG = "TvNetworkClient"
    
    // Cache size for network requests (50MB)
    private val CACHE_SIZE = 50 * 1024 * 1024L
    
    // Timeouts for network requests
    private val CONNECT_TIMEOUT = 15L
    private val READ_TIMEOUT = 30L
    private val WRITE_TIMEOUT = 15L
    
    // Cache control for network requests
    private val CACHE_CONTROL_HEADER = "Cache-Control"
    private val CACHE_CONTROL_NO_CACHE = "no-cache"
    
    // Cache directory
    private val cacheDir = File(context.cacheDir, "tv_network_cache")
    
    // Create cache
    private val cache = Cache(cacheDir, CACHE_SIZE)
    
    // Create Gson instance
    private val gson: Gson = GsonBuilder()
        .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        .create()
    
    // Create OkHttpClient
    private val okHttpClient = OkHttpClient.Builder()
        .cache(cache)
        .connectTimeout(CONNECT_TIMEOUT, TimeUnit.SECONDS)
        .readTimeout(READ_TIMEOUT, TimeUnit.SECONDS)
        .writeTimeout(WRITE_TIMEOUT, TimeUnit.SECONDS)
        .addInterceptor(createLoggingInterceptor())
        .addInterceptor(createCacheInterceptor())
        .addInterceptor(createOfflineCacheInterceptor())
        .build()
    
    /**
     * Create a Retrofit instance for the given base URL
     * @param baseUrl The base URL for the API
     * @return A Retrofit instance
     */
    fun createRetrofit(baseUrl: String): Retrofit {
        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
    }
    
    /**
     * Create a service interface for the given API
     * @param serviceClass The service interface class
     * @param baseUrl The base URL for the API
     * @return An instance of the service interface
     */
    fun <T> createService(serviceClass: Class<T>, baseUrl: String): T {
        return createRetrofit(baseUrl).create(serviceClass)
    }
    
    /**
     * Create a logging interceptor for debug builds
     * @return A logging interceptor
     */
    private fun createLoggingInterceptor(): Interceptor {
        val loggingInterceptor = HttpLoggingInterceptor { message ->
            Log.d(TAG, message)
        }
        
        loggingInterceptor.level = if (isDebugBuild()) {
            HttpLoggingInterceptor.Level.BODY
        } else {
            HttpLoggingInterceptor.Level.NONE
        }
        
        return loggingInterceptor
    }
    
    /**
     * Create a cache interceptor for caching responses
     * @return A cache interceptor
     */
    private fun createCacheInterceptor(): Interceptor {
        return Interceptor { chain ->
            val response = chain.proceed(chain.request())
            
            // Get cache control header
            val cacheControl = response.header(CACHE_CONTROL_HEADER)
            
            // If no cache control header is present, add one
            if (cacheControl == null || cacheControl == CACHE_CONTROL_NO_CACHE) {
                // Cache for 1 hour
                val maxAge = 60 * 60
                
                // Build response with cache control
                return@Interceptor response.newBuilder()
                    .header(CACHE_CONTROL_HEADER, "public, max-age=$maxAge")
                    .build()
            }
            
            response
        }
    }
    
    /**
     * Create an offline cache interceptor for handling offline requests
     * @return An offline cache interceptor
     */
    private fun createOfflineCacheInterceptor(): Interceptor {
        return Interceptor { chain ->
            var request = chain.request()
            
            // If offline, use cached response
            if (!isNetworkAvailable()) {
                // Cache for 7 days
                val maxStale = 60 * 60 * 24 * 7
                
                // Build request with cache control
                request = request.newBuilder()
                    .cacheControl(CacheControl.FORCE_CACHE)
                    .build()
                
                Log.d(TAG, "Offline mode: Using cached response")
            } else if (isLowBandwidthConnection()) {
                // If low bandwidth, prioritize cache but allow network
                // Cache for 1 day
                val maxStale = 60 * 60 * 24
                
                // Build request with cache control
                request = request.newBuilder()
                    .cacheControl(CacheControl.Builder()
                        .maxStale(maxStale, TimeUnit.SECONDS)
                        .build())
                    .build()
                
                Log.d(TAG, "Low bandwidth: Prioritizing cached response")
            }
            
            chain.proceed(request)
        }
    }
    
    /**
     * Check if the app is running in debug mode
     * @return True if the app is running in debug mode, false otherwise
     */
    private fun isDebugBuild(): Boolean {
        return context.applicationInfo.flags and android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE != 0
    }
    
    /**
     * Check if the device has an active network connection
     * @return True if the device has an active network connection, false otherwise
     */
    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
    
    /**
     * Check if the device has a low bandwidth connection
     * @return True if the device has a low bandwidth connection, false otherwise
     */
    private fun isLowBandwidthConnection(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return true
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return true
        
        // Check if the connection is metered (e.g., mobile data)
        if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
            return true
        }
        
        // Check if the connection is a slow Wi-Fi connection
        if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
            // Check signal strength or other metrics if available
            // For simplicity, we'll assume Wi-Fi is fast enough
            return false
        }
        
        // Default to assuming low bandwidth for other connection types
        return true
    }
} 
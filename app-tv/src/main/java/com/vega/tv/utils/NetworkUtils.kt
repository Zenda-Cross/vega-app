package com.vega.tv.utils

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.widget.Toast
import com.vega.tv.R
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow

/**
 * Utility class for network-related operations.
 */
object NetworkUtils {

    /**
     * Check if network is available
     */
    fun isNetworkAvailable(context: Context): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val network = connectivityManager.activeNetwork ?: return false
            val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
            return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } else {
            @Suppress("DEPRECATION")
            val networkInfo = connectivityManager.activeNetworkInfo
            @Suppress("DEPRECATION")
            return networkInfo != null && networkInfo.isConnected
        }
    }

    /**
     * Show a toast message indicating network is unavailable
     */
    fun showNetworkUnavailableMessage(context: Context) {
        Toast.makeText(context, R.string.network_error, Toast.LENGTH_LONG).show()
    }

    /**
     * Get a Flow that emits network connectivity status changes
     */
    fun getNetworkStatusFlow(context: Context): Flow<Boolean> = callbackFlow {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                trySend(true)
            }

            override fun onLost(network: Network) {
                trySend(false)
            }
        }

        // Send initial value
        trySend(isNetworkAvailable(context))

        // Register callback
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        connectivityManager.registerNetworkCallback(request, callback)

        // Clean up when Flow collection ends
        awaitClose {
            connectivityManager.unregisterNetworkCallback(callback)
        }
    }

    /**
     * Check if the error is likely a network error
     */
    fun isNetworkError(throwable: Throwable): Boolean {
        return throwable.message?.contains("timeout", ignoreCase = true) == true ||
                throwable.message?.contains("unable to resolve host", ignoreCase = true) == true ||
                throwable.message?.contains("failed to connect", ignoreCase = true) == true ||
                throwable.message?.contains("network", ignoreCase = true) == true
    }
} 
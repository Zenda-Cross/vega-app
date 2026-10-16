package com.vega

import android.util.Log
import com.facebook.react.modules.network.OkHttpClientFactory
import com.facebook.react.modules.network.ReactCookieJarContainer
import okhttp3.Cache
import okhttp3.ConnectionPool
import okhttp3.Dns
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.OkHttpClient
import okhttp3.dnsoverhttps.DnsOverHttps
import java.io.EOFException
import java.io.File
import java.io.IOException
import java.io.InputStream
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Proxy
import java.net.ProxySelector
import java.net.Socket
import java.net.SocketAddress
import java.net.URI
import java.net.UnknownHostException
import java.util.concurrent.TimeUnit
import javax.net.SocketFactory

private const val TAG = "DohOkHttpFactory"

enum class DohProvider(val displayName: String, val url: String, val bootstrapIps: List<String>) {
    CLOUDFLARE("Cloudflare", "https://1.1.1.1/dns-query", listOf("1.1.1.1", "1.0.0.1")),
    GOOGLE("Google", "https://dns.google/dns-query", listOf("8.8.8.8", "8.8.4.4")),
    ADGUARD("AdGuard", "https://dns.adguard-dns.com/dns-query", listOf("94.140.14.14", "94.140.15.15")),
}

class DohOkHttpFactory(private val cacheDir: File) : OkHttpClientFactory {

    companion object {
        @Volatile
        var instance: DohOkHttpFactory? = null
            private set
    }

    init {
        instance = this
    }

    @Volatile
    var enabled: Boolean = true

    @Volatile
    var currentProvider: DohProvider = DohProvider.CLOUDFLARE

    @Volatile
    var customUrl: String? = null

    @Volatile
    var warpProxyPort: Int? = null

    @Volatile
    var byeDpiProxyPort: Int? = null

    // Every client made here (network module, Fresco images, downloads) shares one pool, so
    // turning WARP or ByeDPI on or off can drop all open connections. Otherwise a client keeps
    // reusing connections opened before the switch, which bypass the new route.
    private val connectionPool = ConnectionPool()

    fun evictConnections() {
        connectionPool.evictAll()
    }

    private var cachedDoh: DnsOverHttps? = null
    private var lastConfigKey: String = ""

    @Synchronized
    private fun getActiveDns(): Dns {
        // ByeDPI connects to the address resolved here, so it needs DoH even when the user turned
        // DoH off: ISP DNS returns the block page address for blocked sites.
        if (!enabled && byeDpiProxyPort == null) return Dns.SYSTEM

        val configKey = "${currentProvider.name}_$customUrl"
        if (cachedDoh != null && lastConfigKey == configKey) {
            return FallbackDns(cachedDoh!!)
        }

        return try {
            val dnsCache = Cache(File(cacheDir, "dns_cache"), 5L * 1024 * 1024)
            val bootstrapClient = OkHttpClient.Builder()
                .cache(dnsCache)
                .connectTimeout(10, TimeUnit.SECONDS)
                .readTimeout(10, TimeUnit.SECONDS)
                .build()

            val url = customUrl?.takeIf { it.isNotBlank() } ?: currentProvider.url

            val builder = DnsOverHttps.Builder()
                .client(bootstrapClient)
                .url(url.toHttpUrl())

            if (customUrl == null || customUrl!!.isBlank()) {
                val ips = currentProvider.bootstrapIps.map { InetAddress.getByName(it) }
                builder.bootstrapDnsHosts(ips)
            }

            val doh = builder.build()
            VegaLog.i(TAG, "DoH configured with ${customUrl ?: currentProvider.displayName}")
            
            cachedDoh = doh
            lastConfigKey = configKey
            FallbackDns(doh)
        } catch (e: Exception) {
            VegaLog.e(TAG, "Failed to build DoH, falling back to system DNS", e)
            Dns.SYSTEM
        }
    }

    private inner class DynamicDns : Dns {
        override fun lookup(hostname: String): List<InetAddress> {
            return getActiveDns().lookup(hostname)
        }
    }

    override fun createNewNetworkModuleClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .dns(DynamicDns())
            .connectionPool(connectionPool)
            .retryOnConnectionFailure(true)
            .cookieJar(ReactCookieJarContainer())
            .socketFactory(ByeDpiSocketFactory())
            .proxySelector(object : ProxySelector() {
                override fun select(uri: URI?): List<Proxy> {
                    val host = uri?.host?.lowercase()
                    if (host != null && (host == "127.0.0.1" || host == "localhost")) {
                        return listOf(Proxy.NO_PROXY)
                    }
                    val warpPort = warpProxyPort
                    if (warpPort != null && warpPort > 0) {
                        VegaLog.d(TAG, "Routing ${uri?.host} through WARP HTTP proxy on port $warpPort")
                        // WARP only: a direct fallback would quietly send requests past WARP,
                        // straight into the block.
                        return listOf(Proxy(Proxy.Type.HTTP, InetSocketAddress("127.0.0.1", warpPort)))
                    }
                    // For ByeDPI, return Proxy.NO_PROXY so OkHttp resolves DNS via DoH,
                    // and ByeDpiSocketFactory routes the TCP connection to ByeDPI with the resolved IP!
                    return listOf(Proxy.NO_PROXY)
                }

                override fun connectFailed(uri: URI?, sa: SocketAddress?, ioe: IOException?) {
                    // One failed site is not a dead proxy; WarpModule clears the port when the
                    // proxy process exits.
                    VegaLog.w(TAG, "Proxy connection failed for $uri: ${ioe?.message}")
                }
            })
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }
}

class ByeDpiSocketFactory : SocketFactory() {
    override fun createSocket(): Socket {
        return ByeDpiSocket()
    }

    override fun createSocket(host: String?, port: Int): Socket {
        val socket = ByeDpiSocket()
        socket.connect(InetSocketAddress(host, port))
        return socket
    }

    override fun createSocket(host: String?, port: Int, localHost: InetAddress?, localPort: Int): Socket {
        val socket = ByeDpiSocket()
        socket.bind(InetSocketAddress(localHost, localPort))
        socket.connect(InetSocketAddress(host, port))
        return socket
    }

    override fun createSocket(host: InetAddress?, port: Int): Socket {
        val socket = ByeDpiSocket()
        socket.connect(InetSocketAddress(host, port))
        return socket
    }

    override fun createSocket(address: InetAddress?, port: Int, localAddress: InetAddress?, localPort: Int): Socket {
        val socket = ByeDpiSocket()
        socket.bind(InetSocketAddress(localAddress, localPort))
        socket.connect(InetSocketAddress(address, port))
        return socket
    }
}

class ByeDpiSocket : Socket() {

    override fun connect(endpoint: SocketAddress?, timeout: Int) {
        val byeDpiPort = DohOkHttpFactory.instance?.byeDpiProxyPort
        val inetEndpoint = endpoint as? InetSocketAddress

        val hostAddress = inetEndpoint?.address
        val hostName = inetEndpoint?.hostString?.lowercase()
        val isLocal = hostName == "127.0.0.1" || hostName == "localhost" ||
                hostAddress?.isLoopbackAddress == true

        if (byeDpiPort == null || byeDpiPort <= 0 || isLocal || inetEndpoint == null) {
            super.connect(endpoint, timeout)
            return
        }

        try {
            // 1. Connect underlying socket to local ByeDPI proxy
            super.connect(InetSocketAddress("127.0.0.1", byeDpiPort), timeout)
        } catch (e: Exception) {
            // ByeDpiModule clears the port when the process exits; a failure here must not
            // silently switch every later connection to direct.
            VegaLog.w(TAG, "ByeDPI connection failed on port $byeDpiPort: ${e.message}")
            throw e
        }

        val oldSoTimeout = soTimeout
        soTimeout = if (timeout > 0) timeout else 10000

        try {
            val input = getInputStream()
            val output = getOutputStream()

            // 2. SOCKS5 greeting: VER=5, NMETHODS=1, METHOD=0 (No Authentication)
            output.write(byteArrayOf(0x05, 0x01, 0x00))
            output.flush()

            val greetingResp = ByteArray(2)
            readFully(input, greetingResp)
            if (greetingResp[0] != 0x05.toByte() || greetingResp[1] != 0x00.toByte()) {
                throw IOException("SOCKS5 greeting failed: ver=${greetingResp[0]}, auth=${greetingResp[1]}")
            }

            // 3. SOCKS5 request: VER=5, CMD=1 (CONNECT), RSV=0, ATYP
            val targetPort = inetEndpoint.port
            val targetIp = hostAddress?.address

            if (targetIp != null) {
                // Pass the DoH-resolved IP directly (IPv4 or IPv6) so ByeDPI skips local DNS
                val isIpv4 = targetIp.size == 4
                val atyp = if (isIpv4) 0x01.toByte() else 0x04.toByte()
                val req = ByteArray(4 + targetIp.size + 2)
                req[0] = 0x05
                req[1] = 0x01
                req[2] = 0x00
                req[3] = atyp
                System.arraycopy(targetIp, 0, req, 4, targetIp.size)
                req[req.size - 2] = (targetPort ushr 8).toByte()
                req[req.size - 1] = (targetPort and 0xFF).toByte()
                output.write(req)
                output.flush()
            } else {
                val domainBytes = (inetEndpoint.hostString ?: "").toByteArray(Charsets.UTF_8)
                val req = ByteArray(4 + 1 + domainBytes.size + 2)
                req[0] = 0x05
                req[1] = 0x01
                req[2] = 0x00
                req[3] = 0x03.toByte() // DOMAIN
                req[4] = domainBytes.size.toByte()
                System.arraycopy(domainBytes, 0, req, 5, domainBytes.size)
                req[req.size - 2] = (targetPort ushr 8).toByte()
                req[req.size - 1] = (targetPort and 0xFF).toByte()
                output.write(req)
                output.flush()
            }

            // 4. SOCKS5 response header: VER, REP, RSV, ATYP
            val respHeader = ByteArray(4)
            readFully(input, respHeader)
            val rep = respHeader[1].toInt() and 0xFF
            if (rep != 0x00) {
                throw IOException("SOCKS5 connect error code: $rep")
            }

            // Consume bound address
            when (respHeader[3].toInt() and 0xFF) {
                0x01 -> { // IPv4: 4 bytes IP + 2 bytes port
                    val bnd = ByteArray(6)
                    readFully(input, bnd)
                }
                0x03 -> { // Domain: 1 byte len + len bytes + 2 bytes port
                    val len = input.read()
                    if (len < 0) throw EOFException("Unexpected EOF reading SOCKS5 domain length")
                    val bnd = ByteArray(len + 2)
                    readFully(input, bnd)
                }
                0x04 -> { // IPv6: 16 bytes IP + 2 bytes port
                    val bnd = ByteArray(18)
                    readFully(input, bnd)
                }
                else -> {
                    throw IOException("Unsupported SOCKS5 ATYP: ${respHeader[3]}")
                }
            }
        } catch (e: Exception) {
            // Usually one unreachable address; OkHttp tries the next one, still through ByeDPI.
            VegaLog.w(TAG, "ByeDPI handshake failed on port $byeDpiPort: ${e.message}")
            throw e
        } finally {
            soTimeout = oldSoTimeout
        }
    }

    private fun readFully(input: InputStream, buffer: ByteArray) {
        var offset = 0
        while (offset < buffer.size) {
            val bytesRead = input.read(buffer, offset, buffer.size - offset)
            if (bytesRead < 0) {
                throw EOFException("Unexpected EOF during SOCKS5 handshake")
            }
            offset += bytesRead
        }
    }
}

private class FallbackDns(private val primary: DnsOverHttps) : Dns {
    override fun lookup(hostname: String): List<InetAddress> {
        return try {
            Nat64Dns.networkAddresses(primary.lookup(hostname))
        } catch (e: UnknownHostException) {
            VegaLog.w(TAG, "DoH lookup failed for $hostname, falling back to system DNS")
            Dns.SYSTEM.lookup(hostname)
        } catch (e: Exception) {
            VegaLog.w(TAG, "DoH error for $hostname, falling back to system DNS", e)
            Dns.SYSTEM.lookup(hostname)
        }
    }
}

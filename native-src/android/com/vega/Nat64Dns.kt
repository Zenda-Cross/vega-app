package com.vega

import java.net.Inet4Address
import java.net.Inet6Address
import java.net.InetAddress
import java.util.concurrent.Executors
import java.util.concurrent.TimeUnit

/** RFC 7050 discovery; only the discovery name uses system DNS, never provider names. */
internal object Nat64Dns {
    internal data class Prefix(val bytes: List<Byte>, val length: Int) {
        fun synthesize(ip: Inet4Address): InetAddress {
            val result = ByteArray(16)
            bytes.forEachIndexed { index, byte -> result[index] = byte }
            var position = length / 8
            for (byte in ip.address) {
                if (position == 8) position++ // RFC 6052 reserved octet
                result[position++] = byte
            }
            return InetAddress.getByAddress(result)
        }
    }

    internal fun discover(address: InetAddress): Prefix? {
        if (address !is Inet6Address || address.isMulticastAddress || address.isLoopbackAddress) return null
        for (length in listOf(96, 64, 56, 48, 40, 32)) {
            val prefix = Prefix(address.address.take(length / 8), length)
            for (last in listOf(170, 171)) {
                val marker = InetAddress.getByAddress(byteArrayOf(192.toByte(), 0, 0, last.toByte())) as Inet4Address
                if (prefix.synthesize(marker) == address) return prefix
            }
        }
        return null
    }

    internal fun order(addresses: List<InetAddress>, prefixes: List<Prefix>): List<InetAddress> {
        if (prefixes.isEmpty()) return addresses
        val ipv4 = addresses.filterIsInstance<Inet4Address>()
        val ipv6 = addresses.filterIsInstance<Inet6Address>().toMutableList<InetAddress>()
        for (ip in ipv4) for (prefix in prefixes) ipv6.add(prefix.synthesize(ip))
        return buildList {
            for (index in 0 until maxOf(ipv4.size, ipv6.size)) {
                ipv6.getOrNull(index)?.let { add(it) }
                ipv4.getOrNull(index)?.let { add(it) }
            }
        }.distinct()
    }

    private val discoveryExecutor = Executors.newSingleThreadExecutor { task ->
        Thread(task, "Vega-NAT64-discovery").apply { isDaemon = true }
    }
    private var cachedPrefixes: List<Prefix> = emptyList()
    private var refreshedAt: Long? = null
    private var pending: java.util.concurrent.Future<List<Prefix>>? = null

    @Synchronized
    fun networkAddresses(addresses: List<InetAddress>): List<InetAddress> {
        val now = System.nanoTime()
        val refreshed = refreshedAt
        if (refreshed == null || now - refreshed >= TimeUnit.SECONDS.toNanos(60)) {
            // Reuse a pending system lookup rather than piling up work if DNS stalls.
            val lookup = pending ?: discoveryExecutor.submit<List<Prefix>> {
                InetAddress.getAllByName("ipv4only.arpa").mapNotNull { discover(it) }.distinct()
            }.also { pending = it }
            cachedPrefixes = try {
                lookup.get(2, TimeUnit.SECONDS)
            } catch (_: Exception) {
                emptyList()
            }
            if (lookup.isDone) pending = null
            refreshedAt = System.nanoTime()
        }
        return order(addresses, cachedPrefixes)
    }
}

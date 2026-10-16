package com.vega

import java.net.Inet4Address
import java.net.InetAddress

fun main() {
    fun ip(value: String) = InetAddress.getByName(value)
    val prefix = checkNotNull(Nat64Dns.discover(ip("64:ff9b::c000:aa")))
    check(prefix == Nat64Dns.discover(ip("64:ff9b::c000:ab")))
    check(prefix.synthesize(ip("18.66.78.70") as Inet4Address) == ip("64:ff9b::1242:4e46"))
    for (length in listOf(32, 40, 48, 56, 64, 96)) {
        val bytes = ByteArray(length / 8)
        byteArrayOf(0x20, 0x01, 0x0d, 0xb8.toByte()).copyInto(bytes)
        val candidate = Nat64Dns.Prefix(bytes.toList(), length)
        check(Nat64Dns.discover(candidate.synthesize(ip("192.0.0.170") as Inet4Address)) == candidate)
    }
    for (value in listOf("2001:db8::1", "::1", "64:ff9b::c000:ac", "::ffff:192.0.0.170")) {
        check(Nat64Dns.discover(ip(value)) == null)
    }
    val originals = listOf(ip("18.66.78.70"), ip("18.66.78.40"))
    check(Nat64Dns.order(originals, emptyList()) === originals)
    check(Nat64Dns.order(originals, listOf(prefix)) == listOf(
        ip("64:ff9b::1242:4e46"), originals[0], ip("64:ff9b::1242:4e28"), originals[1]))
    check(Nat64Dns.order(listOf(ip("64:ff9b::1242:4e46"), originals[0], originals[0]), listOf(prefix)).size == 2)
    println("NAT64: discovery, all six prefix lengths, rejection, ordering, fallback and deduplication passed")
}

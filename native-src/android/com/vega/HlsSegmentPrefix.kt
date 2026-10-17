package com.vega

import java.io.BufferedInputStream
import java.io.InputStream

/** Some HLS hosts put an image header before MPEG-TS packets. Never alter other data. */
internal object HlsSegmentPrefix {
    private const val PROBE_BYTES = 16 * 1024
    private const val TS_PACKET = 188
    private val PNG = byteArrayOf(0x89.toByte(), 0x50, 0x4e, 0x47, 13, 10, 26, 10)

    data class Result(val stream: InputStream, val skipped: Int)

    fun open(source: InputStream): Result {
        val input = BufferedInputStream(source, PROBE_BYTES)
        input.mark(PROBE_BYTES)
        val probe = ByteArray(PROBE_BYTES)
        var count = 0
        while (count < PNG.size) {
            val n = input.read(probe, count, PNG.size - count)
            if (n < 0) break
            count += n
        }
        if (count == PNG.size && PNG.indices.all { probe[it] == PNG[it] }) {
            while (count < probe.size) {
                val n = input.read(probe, count, probe.size - count)
                if (n < 0) break
                count += n
            }
            // Five aligned TS headers, including non-reserved adaptation-field control,
            // avoid mistaking an actual PNG or encrypted data for a video segment.
            for (offset in PNG.size until count - TS_PACKET * 4 - 3) {
                if ((0..4).all { packet ->
                    val pos = offset + packet * TS_PACKET
                    probe[pos] == 0x47.toByte() && (probe[pos + 3].toInt() and 0x30) != 0
                }) {
                    input.reset()
                    var remaining = offset
                    while (remaining > 0) {
                        val n = input.read(probe, 0, minOf(remaining, probe.size))
                        check(n > 0)
                        remaining -= n
                    }
                    return Result(input, offset)
                }
            }
        }
        input.reset()
        return Result(input, 0)
    }

    /** Keep receiver byte offsets relative to the normalized segment on reconnect. */
    fun upstreamRange(range: String, prefix: Int): String {
        if (prefix == 0) return range
        val match = Regex("bytes=(\\d+)-(\\d*)").matchEntire(range) ?: return range
        return try {
            val start = match.groupValues[1].toLong()
            // Byte zero still fetches the prefix so open() can validate it again.
            val upstreamStart = if (start == 0L) 0L else Math.addExact(start, prefix.toLong())
            val end = match.groupValues[2].takeIf { it.isNotEmpty() }
                ?.toLong()?.let { Math.addExact(it, prefix.toLong()).toString() } ?: ""
            "bytes=$upstreamStart-$end"
        } catch (_: ArithmeticException) { range }
        catch (_: NumberFormatException) { range }
    }

    fun downstreamContentRange(range: String, prefix: Int): String {
        if (prefix == 0) return range
        val match = Regex("bytes (\\d+)-(\\d+)/(\\d+|\\*)").matchEntire(range) ?: return range
        val start = match.groupValues[1].toLongOrNull() ?: return range
        val end = match.groupValues[2].toLongOrNull() ?: return range
        val total = match.groupValues[3].toLongOrNull()?.let { (it - prefix).coerceAtLeast(0).toString() } ?: "*"
        return "bytes ${(start - prefix).coerceAtLeast(0)}-${(end - prefix).coerceAtLeast(0)}/$total"
    }
}

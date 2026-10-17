package com.vega

/** Incremental top-level MP4 box parser; never buffers video payloads. */
internal class Mp4MediaProbe {
    var hasMedia = false
        private set
    private val header = ByteArray(16)
    private var used = 0
    private var needed = 8
    private var remaining = 0L
    private var mediaBox = false
    private var invalid = false

    fun accept(bytes: ByteArray, count: Int) {
        var offset = 0
        while (!invalid && offset < count) {
            if (remaining > 0) {
                val length = minOf(remaining, (count - offset).toLong()).toInt()
                if (mediaBox && length > 0) hasMedia = true
                remaining -= length
                offset += length
                continue
            }
            val length = minOf(needed - used, count - offset)
            bytes.copyInto(header, used, offset, offset + length)
            used += length
            offset += length
            if (used < needed) continue
            var size = 0L
            for (i in 0..3) size = (size shl 8) or (header[i].toLong() and 255)
            if (size == 1L && needed == 8) { needed = 16; continue }
            if (needed == 16) {
                size = 0L
                for (i in 8..15) size = (size shl 8) or (header[i].toLong() and 255)
            }
            if (size != 0L && size < needed) { invalid = true; return }
            mediaBox = String(header, 4, 4, Charsets.US_ASCII) == "mdat"
            remaining = if (size == 0L) Long.MAX_VALUE else size - needed
            used = 0
            needed = 8
        }
    }
}

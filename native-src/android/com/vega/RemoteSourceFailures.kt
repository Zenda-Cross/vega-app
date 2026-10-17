package com.vega

import java.io.IOException
import java.net.URI
import java.time.ZonedDateTime
import java.time.format.DateTimeFormatter

/** No automatic retries for denied reads; rate limits apply across URLs on a host. */
internal object RemoteSourceFailures {
    class Denied(val status: Int, val retrySeconds: Long, message: String) : IOException(message)
    private data class Failure(val status: Int, val until: Long)
    private val failures = LinkedHashMap<String, Failure>()
    private val metadataReads = java.util.concurrent.atomic.AtomicLong()
    private val hlsReads = java.util.concurrent.atomic.AtomicLong()
    private val remuxStarts = java.util.concurrent.atomic.AtomicLong()
    fun noteMetadataRead() { metadataReads.incrementAndGet() }
    fun noteHlsRead() { hlsReads.incrementAndGet() }
    fun noteRemuxStart() { remuxStarts.incrementAndGet() }
    fun trafficSummary(): String = "metadata HTTP requests=${metadataReads.getAndSet(0)}, " +
        "HLS proxy HTTP requests=${hlsReads.getAndSet(0)}, FFmpeg starts=${remuxStarts.getAndSet(0)} " +
        "(FFmpeg internal HTTP requests are not counted)"
    private fun host(url: String): String = try { URI(url).host.orEmpty().lowercase() } catch (_: Exception) { url }

    fun retryDelayMs(value: String?, now: Long): Long {
        val seconds = value?.trim()?.toLongOrNull()
        if (seconds != null && seconds >= 0) return seconds.coerceAtMost(Long.MAX_VALUE / 1000) * 1000L
        val date = try { ZonedDateTime.parse(value, DateTimeFormatter.RFC_1123_DATE_TIME).toInstant().toEpochMilli() } catch (_: Exception) { null }
        return date?.let { (it - now).coerceAtLeast(0L) } ?: 30_000L
    }

    @Synchronized fun record(url: String, status: Int, retryAfter: String? = null) {
        if (status != 403 && status != 429) return
        val now = System.currentTimeMillis()
        val key = if (status == 429) "host:${host(url)}" else "url:$url"
        val delay = if (status == 429) retryDelayMs(retryAfter, now).coerceAtLeast(1000) else 15_000L
        val until = now + minOf(delay, Long.MAX_VALUE - now)
        val previous = failures[key]
        failures[key] = Failure(status, maxOf(until, previous?.until ?: 0L))
        while (failures.size > 128) failures.remove(failures.keys.first())
    }

    @Synchronized fun check(url: String) {
        val now = System.currentTimeMillis()
        for (key in listOf("host:${host(url)}", "url:$url")) {
            val failure = failures[key] ?: continue
            if (failure.until <= now) { failures.remove(key); continue }
            val seconds = (failure.until - now + 999) / 1000
            throw Denied(failure.status, seconds, if (failure.status == 429)
                "Video server rate limited requests (HTTP 429). Wait $seconds seconds before retrying."
                else "Video server denied access (HTTP 403). Try another server or refresh the link.")
        }
    }
}

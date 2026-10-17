package com.vega

import java.util.concurrent.CompletableFuture
import java.util.concurrent.ExecutionException

/** Bounded, session-lifetime cache. Concurrent readers share one metadata fetch. */
internal class RemoteMetadataCache<T>(
    private val maxEntries: Int = 8,
    private val ttlMs: Long = 10 * 60_000L,
    private val failureTtlMs: Long = 15_000L,
    private val now: () -> Long = System::currentTimeMillis
) {
    private data class Entry<T>(val result: Result<T>, val until: Long)
    private val entries = LinkedHashMap<String, Entry<T>>()
    private val pending = HashMap<String, CompletableFuture<T>>()
    private var generation = 0

    fun get(key: String, load: () -> T): T {
        val future: CompletableFuture<T>
        val owner: Boolean
        val initialGeneration: Int
        synchronized(this) {
            entries[key]?.let { if (it.until > now()) return it.result.getOrThrow() }
            entries.remove(key)
            val existing = pending[key]
            owner = existing == null
            future = existing ?: CompletableFuture<T>().also { pending[key] = it }
            initialGeneration = generation
        }
        if (owner) {
            val result = runCatching(load)
            synchronized(this) {
                if (generation == initialGeneration) {
                    entries[key] = Entry(result, now() + if (result.isFailure || result.getOrNull() == null) failureTtlMs else ttlMs)
                    while (entries.size > maxEntries) entries.remove(entries.keys.first())
                }
                if (pending[key] === future) pending.remove(key)
            }
            result.fold({ future.complete(it) }, { future.completeExceptionally(it) })
        }
        try { return future.get() }
        catch (error: ExecutionException) { throw (error.cause ?: error) }
    }

    @Synchronized fun clear() {
        generation++
        entries.clear()
        pending.clear()
    }
}

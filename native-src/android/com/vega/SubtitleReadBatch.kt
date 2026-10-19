package com.vega

import java.util.concurrent.Callable
import java.util.concurrent.ExecutionException
import java.util.concurrent.ExecutorCompletionService
import java.util.concurrent.Executors
import java.util.concurrent.Semaphore

/** Small indexed reads are latency bound. Keep the original concurrency while
 * bounding it across tracks, and cancel the batch on its first failure. */
internal object SubtitleReadBatch {
    const val MAX_PARALLELISM = 32
    private val permits = Semaphore(MAX_PARALLELISM, true)

    fun <T, R> read(items: List<T>, onFailure: () -> Unit, load: (T) -> R): List<R> {
        if (items.isEmpty()) return emptyList()
        val pool = Executors.newFixedThreadPool(minOf(items.size, MAX_PARALLELISM)) { work ->
            Thread(work, "cast-subtitle-read").apply { isDaemon = true }
        }
        val completion = ExecutorCompletionService<Pair<Int, R>>(pool)
        val jobs = items.mapIndexed { index, item ->
            completion.submit(Callable {
                permits.acquire()
                try { index to load(item) } finally { permits.release() }
            })
        }
        try {
            val results = HashMap<Int, R>()
            repeat(items.size) {
                val (index, result) = completion.take().get()
                results[index] = result
            }
            return items.indices.map { results.getValue(it) }
        } catch (error: Exception) {
            onFailure()
            throw (if (error is ExecutionException) error.cause ?: error else error)
        } finally {
            jobs.forEach { it.cancel(true) }
            pool.shutdownNow()
        }
    }
}

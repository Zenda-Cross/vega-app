package com.vega.tv.utils

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.OnLifecycleEvent
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.concurrent.Executors
import java.util.concurrent.PriorityBlockingQueue
import java.util.concurrent.ThreadPoolExecutor
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

/**
 * Background processing optimizer for Android TV applications.
 * Provides optimized thread pools, task prioritization, and lifecycle-aware background processing.
 */
class TvBackgroundOptimizer(private val context: Context) : LifecycleObserver {
    
    // Tag for logging
    private val TAG = "TvBackgroundOptimizer"
    
    // Counter for task IDs
    private val taskIdCounter = AtomicInteger(0)
    
    // Main thread handler
    private val mainHandler = Handler(Looper.getMainLooper())
    
    // Core pool size based on available processors
    private val corePoolSize = Runtime.getRuntime().availableProcessors().coerceAtMost(4)
    
    // Thread pools for different priority tasks
    private val highPriorityExecutor = ThreadPoolExecutor(
        corePoolSize, // Core pool size
        corePoolSize, // Max pool size
        60L, // Keep alive time
        TimeUnit.SECONDS,
        PriorityBlockingQueue<Runnable>(),
        ThreadPoolExecutor.DiscardOldestPolicy()
    )
    
    private val normalPriorityExecutor = ThreadPoolExecutor(
        corePoolSize, // Core pool size
        corePoolSize, // Max pool size
        60L, // Keep alive time
        TimeUnit.SECONDS,
        PriorityBlockingQueue<Runnable>(),
        ThreadPoolExecutor.DiscardOldestPolicy()
    )
    
    private val lowPriorityExecutor = ThreadPoolExecutor(
        1, // Core pool size
        2, // Max pool size
        60L, // Keep alive time
        TimeUnit.SECONDS,
        PriorityBlockingQueue<Runnable>(),
        ThreadPoolExecutor.DiscardOldestPolicy()
    )
    
    // IO-optimized thread pool
    private val ioExecutor = Executors.newFixedThreadPool(corePoolSize)
    
    // Coroutine dispatchers
    val highPriorityDispatcher: CoroutineDispatcher = highPriorityExecutor.asCoroutineDispatcher()
    val normalPriorityDispatcher: CoroutineDispatcher = normalPriorityExecutor.asCoroutineDispatcher()
    val lowPriorityDispatcher: CoroutineDispatcher = lowPriorityExecutor.asCoroutineDispatcher()
    val ioDispatcher: CoroutineDispatcher = ioExecutor.asCoroutineDispatcher()
    
    // Coroutine scopes
    private val supervisorJob = SupervisorJob()
    val highPriorityScope = CoroutineScope(highPriorityDispatcher + supervisorJob)
    val normalPriorityScope = CoroutineScope(normalPriorityDispatcher + supervisorJob)
    val lowPriorityScope = CoroutineScope(lowPriorityDispatcher + supervisorJob)
    val ioScope = CoroutineScope(ioDispatcher + supervisorJob)
    
    // Track active jobs by lifecycle owner
    private val lifecycleJobs = mutableMapOf<LifecycleOwner, MutableList<Job>>()
    
    /**
     * Execute a high-priority task
     * @param task The task to execute
     * @return The task ID
     */
    fun executeHighPriority(task: () -> Unit): Int {
        val taskId = taskIdCounter.incrementAndGet()
        highPriorityExecutor.execute(PriorityRunnable(TaskPriority.HIGH, taskId, task))
        return taskId
    }
    
    /**
     * Execute a normal-priority task
     * @param task The task to execute
     * @return The task ID
     */
    fun executeNormalPriority(task: () -> Unit): Int {
        val taskId = taskIdCounter.incrementAndGet()
        normalPriorityExecutor.execute(PriorityRunnable(TaskPriority.NORMAL, taskId, task))
        return taskId
    }
    
    /**
     * Execute a low-priority task
     * @param task The task to execute
     * @return The task ID
     */
    fun executeLowPriority(task: () -> Unit): Int {
        val taskId = taskIdCounter.incrementAndGet()
        lowPriorityExecutor.execute(PriorityRunnable(TaskPriority.LOW, taskId, task))
        return taskId
    }
    
    /**
     * Execute a task on the main thread
     * @param task The task to execute
     */
    fun executeOnMainThread(task: () -> Unit) {
        mainHandler.post(task)
    }
    
    /**
     * Execute a task on the main thread with delay
     * @param delayMillis The delay in milliseconds
     * @param task The task to execute
     * @return The task ID
     */
    fun executeOnMainThreadDelayed(delayMillis: Long, task: () -> Unit): Int {
        val taskId = taskIdCounter.incrementAndGet()
        mainHandler.postDelayed(task, delayMillis)
        return taskId
    }
    
    /**
     * Launch a coroutine with lifecycle awareness
     * @param lifecycleOwner The lifecycle owner
     * @param priority The task priority
     * @param block The coroutine block
     * @return The job
     */
    fun launchWithLifecycle(
        lifecycleOwner: LifecycleOwner,
        priority: TaskPriority = TaskPriority.NORMAL,
        block: suspend CoroutineScope.() -> Unit
    ): Job {
        // Choose the appropriate scope based on priority
        val scope = when (priority) {
            TaskPriority.HIGH -> highPriorityScope
            TaskPriority.NORMAL -> normalPriorityScope
            TaskPriority.LOW -> lowPriorityScope
            TaskPriority.IO -> ioScope
        }
        
        // Launch the coroutine
        val job = scope.launch {
            block()
        }
        
        // Track the job for lifecycle management
        lifecycleJobs.getOrPut(lifecycleOwner) { mutableListOf() }.add(job)
        
        // Register lifecycle observer if not already registered
        if (lifecycleOwner.lifecycle.currentState != Lifecycle.State.DESTROYED) {
            lifecycleOwner.lifecycle.addObserver(this)
        } else {
            // Cancel immediately if already destroyed
            job.cancel()
        }
        
        return job
    }
    
    /**
     * Cancel all jobs associated with a lifecycle owner
     * @param lifecycleOwner The lifecycle owner
     */
    @OnLifecycleEvent(Lifecycle.Event.ON_DESTROY)
    fun cancelJobs(lifecycleOwner: LifecycleOwner) {
        lifecycleJobs[lifecycleOwner]?.forEach { job ->
            if (job.isActive) {
                job.cancel()
            }
        }
        lifecycleJobs.remove(lifecycleOwner)
        lifecycleOwner.lifecycle.removeObserver(this)
    }
    
    /**
     * Pause non-critical background work when the app is in the background
     */
    @OnLifecycleEvent(Lifecycle.Event.ON_PAUSE)
    fun pauseNonCriticalWork() {
        // Pause low-priority work
        lowPriorityExecutor.queue.clear()
    }
    
    /**
     * Resume background work when the app is in the foreground
     */
    @OnLifecycleEvent(Lifecycle.Event.ON_RESUME)
    fun resumeBackgroundWork() {
        // Nothing to do here, just allow new tasks to be scheduled
    }
    
    /**
     * Shutdown all executors
     */
    fun shutdown() {
        highPriorityExecutor.shutdown()
        normalPriorityExecutor.shutdown()
        lowPriorityExecutor.shutdown()
        ioExecutor.shutdown()
        
        // Cancel all coroutine scopes
        highPriorityScope.cancel()
        normalPriorityScope.cancel()
        lowPriorityScope.cancel()
        ioScope.cancel()
        
        // Cancel supervisor job
        supervisorJob.cancel()
    }
    
    /**
     * Priority runnable for task prioritization
     */
    private inner class PriorityRunnable(
        private val priority: TaskPriority,
        private val id: Int,
        private val task: () -> Unit
    ) : Runnable, Comparable<PriorityRunnable> {
        
        override fun run() {
            try {
                task()
            } catch (e: Exception) {
                Log.e(TAG, "Error executing task $id with priority $priority", e)
            }
        }
        
        override fun compareTo(other: PriorityRunnable): Int {
            // Higher priority tasks come first
            return other.priority.value - this.priority.value
        }
    }
    
    /**
     * Task priority enum
     */
    enum class TaskPriority(val value: Int) {
        HIGH(0),
        NORMAL(1),
        LOW(2),
        IO(3)
    }
    
    companion object {
        /**
         * Create optimized dispatchers for TV applications
         * @return Map of dispatcher name to dispatcher
         */
        fun createOptimizedDispatchers(): Map<String, CoroutineDispatcher> {
            val cpuCount = Runtime.getRuntime().availableProcessors().coerceAtMost(4)
            
            return mapOf(
                "UI" to Dispatchers.Main,
                "Default" to Dispatchers.Default,
                "IO" to Dispatchers.IO,
                "LimitedParallelism" to Dispatchers.IO.limitedParallelism(cpuCount),
                "SingleThread" to Executors.newSingleThreadExecutor().asCoroutineDispatcher()
            )
        }
    }
} 
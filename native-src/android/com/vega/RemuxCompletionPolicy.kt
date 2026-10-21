package com.vega

/** A demuxer warning during a tail/index probe is not a terminal stream failure. */
internal object RemuxCompletionPolicy {
    fun endedEarly(warned: Boolean, expectedMs: Double, producedMs: Double?): Boolean {
        if (!warned || !expectedMs.isFinite() || expectedMs <= 0 ||
            producedMs == null || !producedMs.isFinite() || producedMs < 0) return false
        val toleranceMs = maxOf(5000.0, minOf(30000.0, expectedMs * 0.01))
        return producedMs + toleranceMs < expectedMs
    }
}

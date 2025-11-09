package com.vibtellect.benchmark.utils

import kotlinx.serialization.Serializable
import mu.KotlinLogging

private val logger = KotlinLogging.logger {}

object ColdStartTracker {
    var coldStart = true
    val startTime = System.currentTimeMillis()
}

@Serializable
data class MemoryMetrics(
    val heapUsedMB: Double,
    val heapMaxMB: Double,
    val heapTotalMB: Double
)

@Serializable
data class LambdaContext(
    val functionName: String? = null,
    val functionVersion: String? = null,
    val memoryLimitMB: String? = null,
    val logGroup: String? = null,
    val logStream: String? = null
)

@Serializable
data class Metrics(
    val runtime: String,
    val coldStart: Boolean,
    val uptimeSeconds: Double,
    val memory: MemoryMetrics,
    val kotlinVersion: String,
    val jvmVersion: String,
    val environment: String,
    val lambda: LambdaContext? = null
)

class MetricsCollector {
    private val runtimeName: String
    private val startTime: Long
    private val coldStart: Boolean

    init {
        runtimeName = System.getenv("RUNTIME_NAME") ?: "kotlin"
        startTime = ColdStartTracker.startTime
        coldStart = ColdStartTracker.coldStart
        ColdStartTracker.coldStart = false // Subsequent invocations are warm starts
    }

    fun getMetrics(): Metrics {
        val runtime = Runtime.getRuntime()
        val heapUsed = (runtime.totalMemory() - runtime.freeMemory()) / 1024.0 / 1024.0
        val heapMax = runtime.maxMemory() / 1024.0 / 1024.0
        val heapTotal = runtime.totalMemory() / 1024.0 / 1024.0

        val memoryMetrics = MemoryMetrics(
            heapUsedMB = heapUsed,
            heapMaxMB = heapMax,
            heapTotalMB = heapTotal
        )

        val uptimeSeconds = (System.currentTimeMillis() - startTime) / 1000.0

        val lambdaContext = if (System.getenv("AWS_LAMBDA_FUNCTION_NAME") != null) {
            LambdaContext(
                functionName = System.getenv("AWS_LAMBDA_FUNCTION_NAME"),
                functionVersion = System.getenv("AWS_LAMBDA_FUNCTION_VERSION"),
                memoryLimitMB = System.getenv("AWS_LAMBDA_FUNCTION_MEMORY_SIZE"),
                logGroup = System.getenv("AWS_LAMBDA_LOG_GROUP_NAME"),
                logStream = System.getenv("AWS_LAMBDA_LOG_STREAM_NAME")
            )
        } else {
            null
        }

        val metrics = Metrics(
            runtime = runtimeName,
            coldStart = coldStart,
            uptimeSeconds = uptimeSeconds,
            memory = memoryMetrics,
            kotlinVersion = KotlinVersion.CURRENT.toString(),
            jvmVersion = System.getProperty("java.version"),
            environment = System.getenv("ENVIRONMENT") ?: "dev",
            lambda = lambdaContext
        )

        logger.info {
            "Collected metrics: runtime=$runtimeName, cold_start=$coldStart, uptime=${String.format("%.2f", uptimeSeconds)}s"
        }

        return metrics
    }
}

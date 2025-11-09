package com.vibtellect.benchmark.utils

import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.BeforeEach
import kotlin.test.assertNotNull

class MetricsCollectorTest {

    private val json = Json { prettyPrint = false }

    @BeforeEach
    fun resetColdStart() {
        ColdStartTracker.coldStart = true
    }

    @Nested
    @DisplayName("MetricsCollector initialization tests")
    inner class InitializationTests {

        @Test
        fun `should initialize with custom runtime name`() {
            System.setProperty("RUNTIME_NAME", "kotlin-test")

            val collector = MetricsCollector()
            val metrics = collector.getMetrics()

            assertEquals("kotlin-test", metrics.runtime)
        }

        @Test
        fun `should initialize with default runtime name`() {
            System.clearProperty("RUNTIME_NAME")

            val collector = MetricsCollector()
            val metrics = collector.getMetrics()

            assertEquals("kotlin", metrics.runtime)
        }

        @Test
        fun `should track cold start correctly`() {
            ColdStartTracker.coldStart = true

            val collector1 = MetricsCollector()
            val metrics1 = collector1.getMetrics()

            assertTrue(metrics1.coldStart)

            val collector2 = MetricsCollector()
            val metrics2 = collector2.getMetrics()

            assertFalse(metrics2.coldStart)
        }
    }

    @Nested
    @DisplayName("Metrics collection tests")
    inner class MetricsCollectionTests {

        @Test
        fun `should collect metrics with all fields populated`() {
            val collector = MetricsCollector()
            val metrics = collector.getMetrics()

            assertNotNull(metrics.runtime)
            assertNotNull(metrics.memory)
            assertTrue(metrics.uptimeSeconds >= 0)
            assertNotNull(metrics.kotlinVersion)
            assertNotNull(metrics.jvmVersion)
            assertNotNull(metrics.environment)
        }

        @Test
        fun `should have valid memory metrics`() {
            val collector = MetricsCollector()
            val metrics = collector.getMetrics()

            assertTrue(metrics.memory.heapUsedMB > 0)
            assertTrue(metrics.memory.heapMaxMB > 0)
            assertTrue(metrics.memory.heapTotalMB > 0)
            assertTrue(metrics.memory.heapUsedMB <= metrics.memory.heapTotal MB)
            assertTrue(metrics.memory.heapTotalMB <= metrics.memory.heapMaxMB)
        }

        @Test
        fun `should have increasing uptime`() {
            val collector = MetricsCollector()

            val metrics1 = collector.getMetrics()
            val uptime1 = metrics1.uptimeSeconds

            Thread.sleep(100)

            val metrics2 = collector.getMetrics()
            val uptime2 = metrics2.uptimeSeconds

            assertTrue(uptime2 > uptime1)
        }

        @Test
        fun `should default to dev environment`() {
            System.clearProperty("ENVIRONMENT")

            val collector = MetricsCollector()
            val metrics = collector.getMetrics()

            assertEquals("dev", metrics.environment)
        }

        @Test
        fun `should use custom environment`() {
            System.setProperty("ENVIRONMENT", "test")

            val collector = MetricsCollector()
            val metrics = collector.getMetrics()

            assertEquals("test", metrics.environment)

            System.clearProperty("ENVIRONMENT")
        }
    }

    @Nested
    @DisplayName("Lambda context tests")
    inner class LambdaContextTests {

        @Test
        fun `should include Lambda context when in Lambda environment`() {
            System.setProperty("AWS_LAMBDA_FUNCTION_NAME", "test-function")
            System.setProperty("AWS_LAMBDA_FUNCTION_VERSION", "1")
            System.setProperty("AWS_LAMBDA_FUNCTION_MEMORY_SIZE", "512")
            System.setProperty("AWS_LAMBDA_LOG_GROUP_NAME", "/aws/lambda/test")
            System.setProperty("AWS_LAMBDA_LOG_STREAM_NAME", "2024/01/01/test")

            val collector = MetricsCollector()
            val metrics = collector.getMetrics()

            assertNotNull(metrics.lambda)
            assertEquals("test-function", metrics.lambda?.functionName)
            assertEquals("1", metrics.lambda?.functionVersion)
            assertEquals("512", metrics.lambda?.memoryLimitMB)
            assertEquals("/aws/lambda/test", metrics.lambda?.logGroup)
            assertEquals("2024/01/01/test", metrics.lambda?.logStream)

            System.clearProperty("AWS_LAMBDA_FUNCTION_NAME")
            System.clearProperty("AWS_LAMBDA_FUNCTION_VERSION")
            System.clearProperty("AWS_LAMBDA_FUNCTION_MEMORY_SIZE")
            System.clearProperty("AWS_LAMBDA_LOG_GROUP_NAME")
            System.clearProperty("AWS_LAMBDA_LOG_STREAM_NAME")
        }

        @Test
        fun `should not include Lambda context when not in Lambda`() {
            System.clearProperty("AWS_LAMBDA_FUNCTION_NAME")

            val collector = MetricsCollector()
            val metrics = collector.getMetrics()

            assertNull(metrics.lambda)
        }
    }

    @Nested
    @DisplayName("Version information tests")
    inner class VersionTests {

        @Test
        fun `should include Kotlin version`() {
            val collector = MetricsCollector()
            val metrics = collector.getMetrics()

            assertNotNull(metrics.kotlinVersion)
            assertTrue(metrics.kotlinVersion.isNotEmpty())
            assertTrue(metrics.kotlinVersion.contains("."))
        }

        @Test
        fun `should include JVM version`() {
            val collector = MetricsCollector()
            val metrics = collector.getMetrics()

            assertNotNull(metrics.jvmVersion)
            assertTrue(metrics.jvmVersion.isNotEmpty())
        }
    }

    @Nested
    @DisplayName("Serialization tests")
    inner class SerializationTests {

        @Test
        fun `should serialize Metrics to JSON`() {
            val collector = MetricsCollector()
            val metrics = collector.getMetrics()

            val jsonString = json.encodeToString(metrics)

            assertTrue(jsonString.contains("\"runtime\""))
            assertTrue(jsonString.contains("\"coldStart\""))
            assertTrue(jsonString.contains("\"memory\""))
            assertTrue(jsonString.contains("\"kotlinVersion\""))
        }

        @Test
        fun `should deserialize JSON to Metrics`() {
            val jsonString = """
                {
                    "runtime":"kotlin",
                    "coldStart":true,
                    "uptimeSeconds":1.5,
                    "memory":{
                        "heapUsedMB":50.0,
                        "heapMaxMB":512.0,
                        "heapTotalMB":100.0
                    },
                    "kotlinVersion":"1.9.21",
                    "jvmVersion":"11.0.1",
                    "environment":"test"
                }
            """.trimIndent()

            val metrics = json.decodeFromString<Metrics>(jsonString)

            assertEquals("kotlin", metrics.runtime)
            assertTrue(metrics.coldStart)
            assertEquals(1.5, metrics.uptimeSeconds, 0.01)
            assertEquals(50.0, metrics.memory.heapUsedMB, 0.01)
        }

        @Test
        fun `should round-trip Metrics through JSON`() {
            val collector = MetricsCollector()
            val original = collector.getMetrics()

            val jsonString = json.encodeToString(original)
            val deserialized = json.decodeFromString<Metrics>(jsonString)

            assertEquals(original.runtime, deserialized.runtime)
            assertEquals(original.coldStart, deserialized.coldStart)
            assertEquals(original.environment, deserialized.environment)
        }
    }

    @Nested
    @DisplayName("MemoryMetrics tests")
    inner class MemoryMetricsTests {

        @Test
        fun `should serialize MemoryMetrics`() {
            val memMetrics = MemoryMetrics(
                heapUsedMB = 50.0,
                heapMaxMB = 512.0,
                heapTotalMB = 100.0
            )

            val jsonString = json.encodeToString(memMetrics)

            assertTrue(jsonString.contains("\"heapUsedMB\":50.0"))
            assertTrue(jsonString.contains("\"heapMaxMB\":512.0"))
            assertTrue(jsonString.contains("\"heapTotalMB\":100.0"))
        }

        @Test
        fun `should deserialize MemoryMetrics`() {
            val jsonString = """
                {
                    "heapUsedMB":60.0,
                    "heapMaxMB":1024.0,
                    "heapTotalMB":200.0
                }
            """.trimIndent()

            val memMetrics = json.decodeFromString<MemoryMetrics>(jsonString)

            assertEquals(60.0, memMetrics.heapUsedMB, 0.01)
            assertEquals(1024.0, memMetrics.heapMaxMB, 0.01)
            assertEquals(200.0, memMetrics.heapTotalMB, 0.01)
        }
    }

    @Nested
    @DisplayName("LambdaContext tests")
    inner class LambdaContextSerializationTests {

        @Test
        fun `should serialize LambdaContext`() {
            val ctx = LambdaContext(
                functionName = "test-func",
                functionVersion = "1",
                memoryLimitMB = "512",
                logGroup = "/aws/lambda/test",
                logStream = "2024/01/01/test"
            )

            val jsonString = json.encodeToString(ctx)

            assertTrue(jsonString.contains("\"functionName\":\"test-func\""))
            assertTrue(jsonString.contains("\"memoryLimitMB\":\"512\""))
        }

        @Test
        fun `should deserialize LambdaContext`() {
            val jsonString = """
                {
                    "functionName":"test-func",
                    "functionVersion":"2",
                    "memoryLimitMB":"1024",
                    "logGroup":"/aws/lambda/prod",
                    "logStream":"2024/02/01/prod"
                }
            """.trimIndent()

            val ctx = json.decodeFromString<LambdaContext>(jsonString)

            assertEquals("test-func", ctx.functionName)
            assertEquals("2", ctx.functionVersion)
            assertEquals("1024", ctx.memoryLimitMB)
        }

        @Test
        fun `should handle null fields in LambdaContext`() {
            val ctx = LambdaContext()

            val jsonString = json.encodeToString(ctx)
            val deserialized = json.decodeFromString<LambdaContext>(jsonString)

            assertNull(deserialized.functionName)
            assertNull(deserialized.functionVersion)
            assertNull(deserialized.memoryLimitMB)
        }
    }

    @Nested
    @DisplayName("ColdStartTracker tests")
    inner class ColdStartTrackerTests {

        @Test
        fun `should start with cold start true`() {
            ColdStartTracker.coldStart = true

            assertTrue(ColdStartTracker.coldStart)
        }

        @Test
        fun `should have valid start time`() {
            val startTime = ColdStartTracker.startTime

            assertTrue(startTime > 0)
            assertTrue(startTime <= System.currentTimeMillis())
        }

        @Test
        fun `should toggle cold start`() {
            ColdStartTracker.coldStart = true
            assertTrue(ColdStartTracker.coldStart)

            ColdStartTracker.coldStart = false
            assertFalse(ColdStartTracker.coldStart)
        }
    }

    @Nested
    @DisplayName("Multiple collectors tests")
    inner class MultipleCollectorsTests {

        @Test
        fun `should handle multiple collectors correctly`() {
            ColdStartTracker.coldStart = true

            val collector1 = MetricsCollector()
            val metrics1 = collector1.getMetrics()
            assertTrue(metrics1.coldStart)

            val collector2 = MetricsCollector()
            val metrics2 = collector2.getMetrics()
            assertFalse(metrics2.coldStart)

            val collector3 = MetricsCollector()
            val metrics3 = collector3.getMetrics()
            assertFalse(metrics3.coldStart)
        }

        @Test
        fun `should share start time across collectors`() {
            val collector1 = MetricsCollector()
            val collector2 = MetricsCollector()

            val metrics1 = collector1.getMetrics()
            val metrics2 = collector2.getMetrics()

            // Both should have similar uptimes since they share the same start time
            val uptimeDiff = Math.abs(metrics1.uptimeSeconds - metrics2.uptimeSeconds)
            assertTrue(uptimeDiff < 1.0) // Less than 1 second difference
        }
    }
}

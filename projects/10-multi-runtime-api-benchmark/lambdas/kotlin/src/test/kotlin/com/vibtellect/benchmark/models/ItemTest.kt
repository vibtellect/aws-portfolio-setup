package com.vibtellect.benchmark.models

import kotlinx.serialization.json.Json
import kotlinx.serialization.encodeToString
import kotlinx.serialization.decodeFromString
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import java.time.Instant

class ItemTest {

    private val json = Json { prettyPrint = false }

    @Nested
    @DisplayName("Item serialization tests")
    inner class ItemSerializationTests {

        @Test
        fun `should serialize complete item to JSON`() {
            val item = Item(
                id = "test-123",
                name = "Test Item",
                description = "Test Description",
                price = 19.99,
                createdAt = 1704067200000,
                updatedAt = 1704067200000
            )

            val jsonString = json.encodeToString(item)

            assertTrue(jsonString.contains("\"id\":\"test-123\""))
            assertTrue(jsonString.contains("\"name\":\"Test Item\""))
            assertTrue(jsonString.contains("\"description\":\"Test Description\""))
            assertTrue(jsonString.contains("\"price\":19.99"))
        }

        @Test
        fun `should deserialize JSON to item`() {
            val jsonString = """
                {
                    "id":"test-123",
                    "name":"Test Item",
                    "description":"Test Description",
                    "price":19.99,
                    "created_at":1704067200000,
                    "updated_at":1704067200000
                }
            """.trimIndent()

            val item = json.decodeFromString<Item>(jsonString)

            assertEquals("test-123", item.id)
            assertEquals("Test Item", item.name)
            assertEquals("Test Description", item.description)
            assertEquals(19.99, item.price, 0.01)
            assertEquals(1704067200000, item.createdAt)
            assertEquals(1704067200000, item.updatedAt)
        }

        @Test
        fun `should handle item with empty description`() {
            val item = Item(
                id = "test-456",
                name = "Item",
                description = "",
                price = 9.99,
                createdAt = 1704067200000,
                updatedAt = 1704067200000
            )

            val jsonString = json.encodeToString(item)
            val deserialized = json.decodeFromString<Item>(jsonString)

            assertEquals("", deserialized.description)
        }

        @Test
        fun `should round-trip item through JSON`() {
            val original = Item(
                id = "round-trip-test",
                name = "Round Trip",
                description = "Testing serialization",
                price = 29.99,
                createdAt = 1704067200000,
                updatedAt = 1704067300000
            )

            val jsonString = json.encodeToString(original)
            val deserialized = json.decodeFromString<Item>(jsonString)

            assertEquals(original.id, deserialized.id)
            assertEquals(original.name, deserialized.name)
            assertEquals(original.description, deserialized.description)
            assertEquals(original.price, deserialized.price, 0.01)
            assertEquals(original.createdAt, deserialized.createdAt)
            assertEquals(original.updatedAt, deserialized.updatedAt)
        }
    }

    @Nested
    @DisplayName("ItemCreate serialization tests")
    inner class ItemCreateSerializationTests {

        @Test
        fun `should serialize ItemCreate to JSON`() {
            val itemCreate = ItemCreate(
                name = "New Item",
                description = "New Description",
                price = 39.99
            )

            val jsonString = json.encodeToString(itemCreate)

            assertTrue(jsonString.contains("\"name\":\"New Item\""))
            assertTrue(jsonString.contains("\"description\":\"New Description\""))
            assertTrue(jsonString.contains("\"price\":39.99"))
        }

        @Test
        fun `should deserialize JSON to ItemCreate`() {
            val jsonString = """
                {
                    "name":"New Item",
                    "description":"New Description",
                    "price":39.99
                }
            """.trimIndent()

            val itemCreate = json.decodeFromString<ItemCreate>(jsonString)

            assertEquals("New Item", itemCreate.name)
            assertEquals("New Description", itemCreate.description)
            assertEquals(39.99, itemCreate.price, 0.01)
        }

        @Test
        fun `should handle ItemCreate with empty description`() {
            val itemCreate = ItemCreate(
                name = "Item",
                description = "",
                price = 19.99
            )

            val jsonString = json.encodeToString(itemCreate)
            val deserialized = json.decodeFromString<ItemCreate>(jsonString)

            assertEquals("", deserialized.description)
        }
    }

    @Nested
    @DisplayName("ItemUpdate serialization tests")
    inner class ItemUpdateSerializationTests {

        @Test
        fun `should serialize ItemUpdate with all fields`() {
            val itemUpdate = ItemUpdate(
                name = "Updated Name",
                description = "Updated Description",
                price = 49.99
            )

            val jsonString = json.encodeToString(itemUpdate)

            assertTrue(jsonString.contains("\"name\":\"Updated Name\""))
            assertTrue(jsonString.contains("\"description\":\"Updated Description\""))
            assertTrue(jsonString.contains("\"price\":49.99"))
        }

        @Test
        fun `should serialize ItemUpdate with only name`() {
            val itemUpdate = ItemUpdate(
                name = "Updated Name",
                description = null,
                price = null
            )

            val jsonString = json.encodeToString(itemUpdate)

            assertTrue(jsonString.contains("\"name\":\"Updated Name\""))
        }

        @Test
        fun `should serialize ItemUpdate with only price`() {
            val itemUpdate = ItemUpdate(
                name = null,
                description = null,
                price = 59.99
            )

            val jsonString = json.encodeToString(itemUpdate)

            assertTrue(jsonString.contains("\"price\":59.99"))
        }

        @Test
        fun `should deserialize JSON to ItemUpdate`() {
            val jsonString = """
                {
                    "name":"Updated",
                    "description":"Updated desc",
                    "price":69.99
                }
            """.trimIndent()

            val itemUpdate = json.decodeFromString<ItemUpdate>(jsonString)

            assertEquals("Updated", itemUpdate.name)
            assertEquals("Updated desc", itemUpdate.description)
            assertEquals(69.99, itemUpdate.price ?: 0.0, 0.01)
        }

        @Test
        fun `should handle partial ItemUpdate`() {
            val jsonString = """
                {
                    "name":"Just Name"
                }
            """.trimIndent()

            val itemUpdate = json.decodeFromString<ItemUpdate>(jsonString)

            assertEquals("Just Name", itemUpdate.name)
            assertNull(itemUpdate.description)
            assertNull(itemUpdate.price)
        }
    }

    @Nested
    @DisplayName("Validation tests")
    inner class ValidationTests {

        @Test
        fun `should validate ItemCreate with valid data`() {
            val itemCreate = ItemCreate(
                name = "Valid Item",
                description = "Valid description",
                price = 19.99
            )

            assertTrue(itemCreate.name.isNotEmpty())
            assertTrue(itemCreate.price > 0)
        }

        @Test
        fun `should detect invalid ItemCreate with empty name`() {
            val itemCreate = ItemCreate(
                name = "",
                description = "Description",
                price = 19.99
            )

            assertTrue(itemCreate.name.isEmpty())
        }

        @Test
        fun `should detect invalid ItemCreate with zero price`() {
            val itemCreate = ItemCreate(
                name = "Item",
                description = "Description",
                price = 0.0
            )

            assertFalse(itemCreate.price > 0)
        }

        @Test
        fun `should detect invalid ItemCreate with negative price`() {
            val itemCreate = ItemCreate(
                name = "Item",
                description = "Description",
                price = -5.0
            )

            assertFalse(itemCreate.price > 0)
        }

        @Test
        fun `should validate ItemUpdate with valid name`() {
            val itemUpdate = ItemUpdate(
                name = "Valid Update",
                description = null,
                price = null
            )

            assertNotNull(itemUpdate.name)
            assertTrue(itemUpdate.name!!.isNotEmpty())
        }

        @Test
        fun `should detect invalid ItemUpdate with empty name`() {
            val itemUpdate = ItemUpdate(
                name = "",
                description = null,
                price = null
            )

            assertNotNull(itemUpdate.name)
            assertTrue(itemUpdate.name!!.isEmpty())
        }

        @Test
        fun `should validate ItemUpdate with valid price`() {
            val itemUpdate = ItemUpdate(
                name = null,
                description = null,
                price = 29.99
            )

            assertNotNull(itemUpdate.price)
            assertTrue(itemUpdate.price!! > 0)
        }

        @Test
        fun `should detect invalid ItemUpdate with zero price`() {
            val itemUpdate = ItemUpdate(
                name = null,
                description = null,
                price = 0.0
            )

            assertNotNull(itemUpdate.price)
            assertFalse(itemUpdate.price!! > 0)
        }
    }

    @Nested
    @DisplayName("Response object tests")
    inner class ResponseTests {

        @Test
        fun `should serialize ItemResponse`() {
            val item = Item(
                id = "resp-1",
                name = "Response Item",
                description = "Desc",
                price = 10.0,
                createdAt = 1704067200000,
                updatedAt = 1704067200000
            )

            val response = ItemResponse(
                success = true,
                data = item,
                message = "Success"
            )

            val jsonString = json.encodeToString(response)

            assertTrue(jsonString.contains("\"success\":true"))
            assertTrue(jsonString.contains("\"message\":\"Success\""))
        }

        @Test
        fun `should serialize ErrorResponse`() {
            val errorResponse = ErrorResponse(
                success = false,
                message = "Error occurred",
                error = "Error details"
            )

            val jsonString = json.encodeToString(errorResponse)

            assertTrue(jsonString.contains("\"success\":false"))
            assertTrue(jsonString.contains("\"message\":\"Error occurred\""))
            assertTrue(jsonString.contains("\"error\":\"Error details\""))
        }

        @Test
        fun `should serialize ItemListResponse`() {
            val items = listOf(
                Item("1", "Item 1", "Desc 1", 10.0, 1704067200000, 1704067200000),
                Item("2", "Item 2", "Desc 2", 20.0, 1704067200000, 1704067200000)
            )

            val response = ItemListResponse(
                success = true,
                data = items,
                count = items.size,
                message = "Success"
            )

            val jsonString = json.encodeToString(response)

            assertTrue(jsonString.contains("\"success\":true"))
            assertTrue(jsonString.contains("\"count\":2"))
        }
    }

    @Nested
    @DisplayName("Timestamp tests")
    inner class TimestampTests {

        @Test
        fun `currentTimestamp should return valid timestamp`() {
            val timestamp = currentTimestamp()

            assertTrue(timestamp > 0)
            assertTrue(timestamp > 1577836800000) // After 2020-01-01
        }

        @Test
        fun `currentTimestamp should increase over time`() {
            val timestamp1 = currentTimestamp()
            Thread.sleep(10)
            val timestamp2 = currentTimestamp()

            assertTrue(timestamp2 >= timestamp1)
        }

        @Test
        fun `timestamp should be in milliseconds`() {
            val timestamp = currentTimestamp()
            val instant = Instant.ofEpochMilli(timestamp)

            assertNotNull(instant)
            assertTrue(instant.isAfter(Instant.parse("2020-01-01T00:00:00Z")))
        }
    }
}

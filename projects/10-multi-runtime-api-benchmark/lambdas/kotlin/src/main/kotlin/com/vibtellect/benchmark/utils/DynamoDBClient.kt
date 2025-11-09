package com.vibtellect.benchmark.utils

import com.benasher44.uuid.uuid4
import com.vibtellect.benchmark.models.*
import mu.KotlinLogging
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbEnhancedClient
import software.amazon.awssdk.enhanced.dynamodb.DynamoDbTable
import software.amazon.awssdk.enhanced.dynamodb.Key
import software.amazon.awssdk.enhanced.dynamodb.TableSchema
import software.amazon.awssdk.enhanced.dynamodb.model.ScanEnhancedRequest
import software.amazon.awssdk.services.dynamodb.DynamoDbClient as AwsDynamoDbClient

private val logger = KotlinLogging.logger {}

class DynamoDBClient(tableName: String? = null) {
    private val client: DynamoDbEnhancedClient
    private val table: DynamoDbTable<Item>
    private val tableName: String

    init {
        this.tableName = tableName ?: System.getenv("TABLE_NAME") ?: "dev-benchmark-items"

        val dynamoDbClient = AwsDynamoDbClient.builder().build()
        this.client = DynamoDbEnhancedClient.builder()
            .dynamoDbClient(dynamoDbClient)
            .build()

        this.table = client.table(this.tableName, TableSchema.fromBean(Item::class.java))

        logger.info { "DynamoDB client initialized for table: ${this.tableName}" }
    }

    fun createItem(itemData: ItemCreate): Item {
        val itemId = uuid4().toString()
        val currentTime = currentTimestamp()

        val item = Item(
            id = itemId,
            name = itemData.name,
            description = itemData.description ?: "",
            price = itemData.price,
            createdAt = currentTime,
            updatedAt = currentTime
        )

        try {
            table.putItem(item)
            logger.info { "Created item: $itemId" }
            return item
        } catch (e: Exception) {
            logger.error(e) { "Error creating item" }
            throw e
        }
    }

    fun getItem(itemId: String): Item? {
        return try {
            val key = Key.builder().partitionValue(itemId).build()
            val item = table.getItem(key)

            if (item != null) {
                logger.info { "Retrieved item: $itemId" }
            } else {
                logger.warn { "Item not found: $itemId" }
            }

            item
        } catch (e: Exception) {
            logger.error(e) { "Error getting item $itemId" }
            throw e
        }
    }

    fun updateItem(itemId: String, itemData: ItemUpdate): Item? {
        // Check if item exists
        val existingItem = getItem(itemId) ?: return null

        // Apply updates
        val updatedItem = existingItem.copy(
            name = itemData.name ?: existingItem.name,
            description = itemData.description ?: existingItem.description,
            price = itemData.price ?: existingItem.price,
            updatedAt = currentTimestamp()
        )

        return try {
            table.putItem(updatedItem)
            logger.info { "Updated item: $itemId" }
            updatedItem
        } catch (e: Exception) {
            logger.error(e) { "Error updating item $itemId" }
            throw e
        }
    }

    fun deleteItem(itemId: String): Boolean {
        // Check if item exists
        val existingItem = getItem(itemId) ?: return false

        return try {
            val key = Key.builder().partitionValue(itemId).build()
            table.deleteItem(key)
            logger.info { "Deleted item: $itemId" }
            true
        } catch (e: Exception) {
            logger.error(e) { "Error deleting item $itemId" }
            throw e
        }
    }

    fun listItems(limit: Int = 100): List<Item> {
        return try {
            val request = ScanEnhancedRequest.builder()
                .limit(limit)
                .build()

            val items = table.scan(request)
                .items()
                .toList()

            logger.info { "Listed ${items.size} items" }
            items
        } catch (e: Exception) {
            logger.error(e) { "Error listing items" }
            throw e
        }
    }
}

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
import software.amazon.awssdk.services.dynamodb.model.AttributeValue

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

    /**
     * Lists items with optional pagination support
     *
     * @param limit Maximum number of items to return (default: 100)
     * @param exclusiveStartKey Optional key to start scanning from (for pagination)
     * @return Pair of (items, lastEvaluatedKey) where lastEvaluatedKey is null if no more items
     */
    fun listItems(
        limit: Int = 100,
        exclusiveStartKey: Map<String, AttributeValue>? = null
    ): Pair<List<Item>, Map<String, AttributeValue>?> {
        return try {
            val actualLimit = if (limit > 0) limit else 100

            val requestBuilder = ScanEnhancedRequest.builder()
                .limit(actualLimit)

            // Add exclusiveStartKey if provided
            if (exclusiveStartKey != null) {
                requestBuilder.exclusiveStartKey(exclusiveStartKey)
            }

            val request = requestBuilder.build()

            // Scan and get first page
            val scanResult = table.scan(request).iterator()

            val items = mutableListOf<Item>()
            var lastEvaluatedKey: Map<String, AttributeValue>? = null

            if (scanResult.hasNext()) {
                val page = scanResult.next()
                items.addAll(page.items())
                lastEvaluatedKey = page.lastEvaluatedKey()
            }

            val hasMore = lastEvaluatedKey != null && lastEvaluatedKey.isNotEmpty()
            logger.info { "Listed ${items.size} items (hasMore: $hasMore)" }

            Pair(items, if (hasMore) lastEvaluatedKey else null)
        } catch (e: Exception) {
            logger.error(e) { "Error listing items" }
            throw e
        }
    }
}

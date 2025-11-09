package com.vibtellect.benchmark.models

import kotlinx.serialization.Serializable
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbBean
import software.amazon.awssdk.enhanced.dynamodb.mapper.annotations.DynamoDbPartitionKey

@Serializable
@DynamoDbBean
data class Item(
    @get:DynamoDbPartitionKey
    var id: String = "",
    var name: String = "",
    var description: String = "",
    var price: Double = 0.0,
    var createdAt: Long = 0L,
    var updatedAt: Long = 0L
)

@Serializable
data class ItemCreate(
    val name: String,
    val description: String? = null,
    val price: Double
)

@Serializable
data class ItemUpdate(
    val name: String? = null,
    val description: String? = null,
    val price: Double? = null
)

@Serializable
data class ItemResponse(
    val success: Boolean,
    val data: Item? = null,
    val message: String? = null
)

@Serializable
data class ItemListResponse(
    val success: Boolean,
    val data: List<Item>,
    val count: Int,
    val message: String? = null
)

@Serializable
data class ErrorResponse(
    val success: Boolean = false,
    val message: String,
    val error: String? = null
)

@Serializable
data class SuccessResponse(
    val success: Boolean = true,
    val message: String
)

fun currentTimestamp(): Long = System.currentTimeMillis()

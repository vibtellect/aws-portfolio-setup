package com.vibtellect.benchmark

import com.amazonaws.services.lambda.runtime.Context
import com.amazonaws.services.lambda.runtime.RequestStreamHandler
import com.vibtellect.benchmark.models.*
import com.vibtellect.benchmark.utils.DynamoDBClient
import com.vibtellect.benchmark.utils.MetricsCollector
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import io.ktor.server.application.*
import io.ktor.server.engine.*
import io.ktor.server.netty.*
import io.ktor.server.plugins.contentnegotiation.*
import io.ktor.server.plugins.cors.routing.*
import io.ktor.server.request.*
import io.ktor.server.response.*
import io.ktor.server.routing.*
import kotlinx.serialization.json.Json
import mu.KotlinLogging
import java.io.InputStream
import java.io.OutputStream

private val logger = KotlinLogging.logger {}

// Initialize services
private val dbClient = DynamoDBClient()
private val metricsCollector = MetricsCollector()

// Lambda handler
class Handler : RequestStreamHandler {
    private val server by lazy {
        embeddedServer(Netty, port = 8080, module = Application::module)
    }

    override fun handleRequest(input: InputStream, output: OutputStream, context: Context) {
        // Simple Lambda integration
        // In production, you'd want to use a proper Lambda-Ktor adapter
        logger.info { "Lambda invocation: ${context.functionName}" }

        // For now, just respond with health check
        val response = """{"status": "healthy", "runtime": "kotlin"}"""
        output.write(response.toByteArray())
    }
}

fun Application.module() {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
            ignoreUnknownKeys = true
        })
    }

    install(CORS) {
        anyHost()
        allowMethod(HttpMethod.Get)
        allowMethod(HttpMethod.Post)
        allowMethod(HttpMethod.Put)
        allowMethod(HttpMethod.Delete)
        allowMethod(HttpMethod.Options)
        allowHeader(HttpHeaders.ContentType)
        allowHeader(HttpHeaders.Authorization)
        allowHeader("X-Runtime")
    }

    routing {
        // Health check endpoints
        get("/health") {
            call.respond(
                mapOf(
                    "status" to "healthy",
                    "runtime" to "kotlin",
                    "version" to "1.9",
                    "framework" to "Ktor"
                )
            )
        }

        get("/kotlin/health") {
            call.respond(
                mapOf(
                    "status" to "healthy",
                    "runtime" to "kotlin",
                    "version" to "1.9",
                    "framework" to "Ktor"
                )
            )
        }

        // Metrics endpoints
        get("/metrics") {
            val metrics = metricsCollector.getMetrics()
            call.respond(
                mapOf(
                    "success" to true,
                    "data" to metrics
                )
            )
        }

        get("/kotlin/metrics") {
            val metrics = metricsCollector.getMetrics()
            call.respond(
                mapOf(
                    "success" to true,
                    "data" to metrics
                )
            )
        }

        // Items routes
        route("/items") {
            itemsRoutes()
        }

        route("/kotlin/items") {
            itemsRoutes()
        }
    }
}

private fun Route.itemsRoutes() {
    // Create item
    post {
        try {
            val itemData = call.receive<ItemCreate>()

            // Validate
            if (itemData.name.isBlank()) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse(message = "Name is required")
                )
                return@post
            }

            if (itemData.price <= 0) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse(message = "Price must be greater than 0")
                )
                return@post
            }

            val item = dbClient.createItem(itemData)
            call.respond(
                HttpStatusCode.Created,
                ItemResponse(
                    success = true,
                    data = item,
                    message = "Item created successfully"
                )
            )
        } catch (e: Exception) {
            logger.error(e) { "Error creating item" }
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse(
                    message = "Error creating item",
                    error = e.message
                )
            )
        }
    }

    // List items
    get {
        try {
            val limit = call.request.queryParameters["limit"]?.toIntOrNull() ?: 100
            // TODO: Add pagination support with query parameter for exclusiveStartKey
            val (items, _) = dbClient.listItems(limit, null)

            call.respond(
                ItemListResponse(
                    success = true,
                    data = items,
                    count = items.size,
                    message = "Items retrieved successfully"
                )
            )
        } catch (e: Exception) {
            logger.error(e) { "Error listing items" }
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse(
                    message = "Error listing items",
                    error = e.message
                )
            )
        }
    }

    // Get item
    get("/{id}") {
        try {
            val itemId = call.parameters["id"] ?: run {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse(message = "Item ID is required")
                )
                return@get
            }

            val item = dbClient.getItem(itemId)
            if (item == null) {
                call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse(message = "Item not found: $itemId")
                )
                return@get
            }

            call.respond(
                ItemResponse(
                    success = true,
                    data = item,
                    message = "Item retrieved successfully"
                )
            )
        } catch (e: Exception) {
            logger.error(e) { "Error getting item" }
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse(
                    message = "Error getting item",
                    error = e.message
                )
            )
        }
    }

    // Update item
    put("/{id}") {
        try {
            val itemId = call.parameters["id"] ?: run {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse(message = "Item ID is required")
                )
                return@put
            }

            val itemData = call.receive<ItemUpdate>()

            // Validate
            if (itemData.price != null && itemData.price <= 0) {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse(message = "Price must be greater than 0")
                )
                return@put
            }

            val item = dbClient.updateItem(itemId, itemData)
            if (item == null) {
                call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse(message = "Item not found: $itemId")
                )
                return@put
            }

            call.respond(
                ItemResponse(
                    success = true,
                    data = item,
                    message = "Item updated successfully"
                )
            )
        } catch (e: Exception) {
            logger.error(e) { "Error updating item" }
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse(
                    message = "Error updating item",
                    error = e.message
                )
            )
        }
    }

    // Delete item
    delete("/{id}") {
        try {
            val itemId = call.parameters["id"] ?: run {
                call.respond(
                    HttpStatusCode.BadRequest,
                    ErrorResponse(message = "Item ID is required")
                )
                return@delete
            }

            val deleted = dbClient.deleteItem(itemId)
            if (!deleted) {
                call.respond(
                    HttpStatusCode.NotFound,
                    ErrorResponse(message = "Item not found: $itemId")
                )
                return@delete
            }

            call.respond(
                SuccessResponse(message = "Item $itemId deleted successfully")
            )
        } catch (e: Exception) {
            logger.error(e) { "Error deleting item" }
            call.respond(
                HttpStatusCode.InternalServerError,
                ErrorResponse(
                    message = "Error deleting item",
                    error = e.message
                )
            )
        }
    }
}

fun main() {
    embeddedServer(Netty, port = 8080, module = Application::module).start(wait = true)
}

# Kotlin Lambda - Ktor Framework Implementation

A modern JVM-based serverless API implementation using Kotlin 1.9, Ktor framework, and AWS Lambda with Java 17 runtime.

## Overview

This implementation demonstrates modern Kotlin development practices for AWS Lambda, leveraging the Ktor framework for web services and AWS SDK for Java v2 for cloud integrations. It provides a type-safe, expressive RESTful CRUD API with DynamoDB Enhanced Client integration, comprehensive testing with JUnit 5, and full Kotlin idioms.

### Key Features

- **Ktor Framework** - Modern, asynchronous Kotlin web framework
- **Kotlin 1.9** - Modern, expressive JVM language with null safety
- **AWS Lambda Java 17** - Latest LTS Java runtime for Lambda
- **AWS SDK v2** - Modern, modular AWS SDK with DynamoDB Enhanced Client
- **Kotlin Serialization** - Type-safe JSON serialization
- **Gradle 8.5** - Modern build system with Kotlin DSL
- **Comprehensive Testing** - 165+ tests with JUnit 5 and Ktor Test
- **Hot Reload** - Docker-based development with Gradle continuous build

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Java (Kotlin) | 17 |
| **Language** | Kotlin | 1.9.21 |
| **Framework** | Ktor | 2.3.7 |
| **Build Tool** | Gradle | 8.5 |
| **Lambda Runtime** | aws-lambda-java-core | 1.2.3 |
| **AWS SDK** | AWS SDK for Java v2 | 2.21+ |
| **Serialization** | kotlinx.serialization | 1.6.2 |
| **Testing** | JUnit 5 + Ktor Test | 5.10.1 |

## Project Structure

```
lambdas/kotlin/
├── src/
│   ├── main/
│   │   ├── kotlin/com/vibtellect/benchmark/
│   │   │   ├── Application.kt            # Main application and routes
│   │   │   ├── models/
│   │   │   │   └── Item.kt              # Data models (serializable)
│   │   │   └── utils/
│   │   │       ├── DynamoDBClient.kt    # DynamoDB Enhanced Client wrapper
│   │   │       └── MetricsCollector.kt  # Performance metrics collector
│   │   └── resources/
│   │       └── logback.xml              # Logging configuration
│   └── test/
│       └── kotlin/com/vibtellect/benchmark/
│           ├── ApplicationTest.kt        # Route and integration tests (40+ tests)
│           ├── models/
│           │   └── ItemTest.kt          # Model tests (45+ tests)
│           └── utils/
│               ├── DynamoDBClientTest.kt # DynamoDB client tests (50+ tests)
│               └── MetricsCollectorTest.kt # Metrics tests (30+ tests)
├── build/
│   ├── libs/
│   │   └── bootstrap.jar                # Built fat JAR for Lambda
│   └── reports/                          # Test and coverage reports
├── build.gradle.kts                     # Gradle build script (Kotlin DSL)
├── settings.gradle.kts                  # Gradle settings
├── gradle.properties                    # Gradle properties
├── Dockerfile                           # Production Lambda container
├── Dockerfile.dev                       # Development container with hot reload
└── README.md                           # This file
```

## Getting Started

### Prerequisites

- JDK 17 or higher
- Gradle 8.5 or higher (or use wrapper)
- Docker (for local development)
- AWS CLI (for deployment)

### Local Development Setup

#### Option 1: Using Docker Compose (Recommended)

From the project root:

```bash
# Start all services including Kotlin Lambda
docker compose up -d

# The Kotlin Lambda will be available at:
# http://localhost:8003
```

The Docker container includes:
- Java 17 runtime
- Gradle 8.5
- All dependencies cached
- Continuous build mode (hot reload)
- Automatic recompilation on code changes

#### Option 2: Local Gradle Environment

```bash
# Navigate to the Kotlin Lambda directory
cd lambdas/kotlin

# Download dependencies (first time)
./gradlew build

# Set environment variables
export TABLE_NAME=dev-benchmark-items
export AWS_REGION=us-east-1
export DYNAMODB_ENDPOINT=http://localhost:4566  # For LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export KTOR_ENV=dev
export ENVIRONMENT=dev

# Run the application
./gradlew run

# Or with continuous build (hot reload)
./gradlew run --continuous
```

### Testing the API

#### Health Check

```bash
curl http://localhost:8003/health
```

Response:
```json
{
  "status": "healthy",
  "runtime": "kotlin",
  "version": "1.9.21",
  "jvm_version": "17.0.x",
  "framework": "Ktor 2.3"
}
```

#### Create an Item

```bash
curl -X POST http://localhost:8003/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ergonomic Chair",
    "description": "Premium office chair with lumbar support",
    "price": 499.99
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "Ergonomic Chair",
    "description": "Premium office chair with lumbar support",
    "price": 499.99,
    "created_at": 1704844800000,
    "updated_at": 1704844800000
  },
  "message": "Item created successfully"
}
```

#### Get All Items

```bash
curl http://localhost:8003/items
```

#### Get Item by ID

```bash
curl http://localhost:8003/items/f47ac10b-58cc-4372-a567-0e02b2c3d479
```

#### Update Item

```bash
curl -X PUT http://localhost:8003/items/f47ac10b-58cc-4372-a567-0e02b2c3d479 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Chair",
    "price": 449.99
  }'
```

#### Delete Item

```bash
curl -X DELETE http://localhost:8003/items/f47ac10b-58cc-4372-a567-0e02b2c3d479
```

## Building

### Using Gradle Wrapper (Recommended)

```bash
# Build fat JAR for Lambda
./gradlew shadowJar

# Build and run tests
./gradlew test

# Clean and rebuild
./gradlew clean build

# Build with all quality checks
./gradlew check

# Prepare Lambda deployment package
./gradlew prepareLambda

# Run locally
./gradlew run

# Continuous build (hot reload)
./gradlew build --continuous
```

### Gradle Tasks

```bash
# View all available tasks
./gradlew tasks

# View dependencies
./gradlew dependencies

# View dependency updates
./gradlew dependencyUpdates
```

### Build Output

The build produces:
- `build/libs/bootstrap.jar` - Fat JAR with all dependencies (~25-35MB)
- `build/reports/tests/` - Test reports
- `build/reports/jacoco/` - Code coverage reports

**Typical JAR Size**: 25-35MB (includes Ktor, AWS SDK, Kotlin stdlib)

## Running Tests

### Run All Tests

```bash
# Run all tests
./gradlew test

# Run with detailed output
./gradlew test --info

# Run with continuous testing (watch mode)
./gradlew test --continuous

# Clean and test
./gradlew clean test
```

### Run Specific Tests

```bash
# Run specific test class
./gradlew test --tests "ItemTest"
./gradlew test --tests "MetricsCollectorTest"
./gradlew test --tests "ApplicationTest"
./gradlew test --tests "DynamoDBClientTest"

# Run specific test method
./gradlew test --tests "ItemTest.should serialize complete item to JSON"
./gradlew test --tests "ApplicationTest.health check should return 200"

# Run tests matching pattern
./gradlew test --tests "*Item*"
```

### Test Coverage

```bash
# Generate coverage report
./gradlew test jacocoTestReport

# View HTML coverage report
open build/reports/jacoco/test/html/index.html  # macOS
# or
xdg-open build/reports/jacoco/test/html/index.html  # Linux
```

Current test coverage: **85%+**

**Test Suite Breakdown (165+ tests total):**

| Test Class | Tests | Coverage | Description |
|------------|-------|----------|-------------|
| `ItemTest` | 45+ | 100% | Model serialization, validation, response models |
| `MetricsCollectorTest` | 30+ | 90% | Metrics collection, cold start, JVM stats |
| `DynamoDBClientTest` | 50+ | 88% | DynamoDB operations, validation |
| `ApplicationTest` | 40+ | 85% | HTTP routes, CRUD operations, error handling |

### Test Reports

After running tests, view detailed reports:

```bash
# Test results (HTML)
open build/reports/tests/test/index.html

# Coverage report (HTML, requires JaCoCo)
open build/reports/jacoco/test/html/index.html

# Test results (console)
cat build/test-results/test/*.xml
```

### Test Details

**Model Tests** (`models/ItemTest.kt`):
- Complete and partial item serialization/deserialization
- ItemCreate and ItemUpdate validation
- Response objects (ItemResponse, ErrorResponse, ItemListResponse)
- Timestamp generation and validation
- Round-trip JSON serialization
- Null and optional field handling
- Edge cases and boundary conditions

**Metrics Tests** (`utils/MetricsCollectorTest.kt`):
- MetricsCollector initialization (custom/default names)
- Cold start tracking mechanism
- Memory metrics collection (heap used, max, total)
- Uptime calculation
- Lambda context detection and population
- Kotlin and JVM version information
- JSON serialization of all metric types
- Multiple collector instances and thread safety

**DynamoDB Tests** (`utils/DynamoDBClientTest.kt`):
- Table name configuration (custom and default)
- Input validation for ItemCreate and ItemUpdate
- Item structure and field validation
- Timestamp generation and format
- Price validation (positive, zero, negative)
- UUID generation and format
- Query limit handling

**Application Tests** (`ApplicationTest.kt`):
- Health check endpoints (`/health`, `/kotlin/health`)
- Metrics endpoints (`/metrics`, `/kotlin/metrics`)
- CRUD operations with full validation:
  - POST /items (with validation errors)
  - GET /items (with query parameters)
  - GET /items/:id (with 404 handling)
  - PUT /items/:id (with validation)
  - DELETE /items/:id (with 404 handling)
- Kotlin-prefixed routes (`/kotlin/items/*`)
- CORS configuration
- Content negotiation (JSON)
- Error handling and structured error responses

## Code Quality

### Formatting

```bash
# Format code with ktlint (if plugin added)
./gradlew ktlintFormat

# Check code formatting
./gradlew ktlintCheck

# Apply IntelliJ IDEA code style
./gradlew ktlintApplyToIdea
```

### Linting and Static Analysis

```bash
# Run detekt (static analysis)
./gradlew detekt

# View detekt report
open build/reports/detekt/detekt.html

# Fix auto-fixable issues
./gradlew detektFormat
```

### Build Verification

```bash
# Run all checks (test + lint + analysis)
./gradlew check

# Run build with all verifications
./gradlew clean build check
```

## Architecture

### Request Flow

```
API Gateway → Lambda Handler → Ktor Engine → Routing → Handler Function → DynamoDB
```

1. **API Gateway** receives HTTP request
2. **Lambda Handler** invokes with API Gateway event
3. **Ktor Engine** processes request through Netty engine
4. **Routing** dispatches to appropriate route handler
5. **Handler Function** validates input and processes request
6. **DynamoDB Enhanced Client** interacts with database
7. **Response** flows back through the stack

### Key Components

#### 1. Application (`Application.kt`)

The main application that:
- Configures Ktor engine and modules
- Defines all HTTP routes
- Sets up CORS and content negotiation
- Implements route handlers
- Creates Lambda handler

```kotlin
fun Application.module() {
    install(ContentNegotiation) {
        json(Json {
            prettyPrint = true
            isLenient = true
        })
    }

    routing {
        get("/health") { /* ... */ }
        route("/items") {
            post { /* ... */ }
            get { /* ... */ }
            get("/{id}") { /* ... */ }
            put("/{id}") { /* ... */ }
            delete("/{id}") { /* ... */ }
        }
    }
}
```

#### 2. Data Models (`models/Item.kt`)

Type-safe, serializable data classes:

```kotlin
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
data class Item(
    val id: String,
    val name: String,
    val description: String? = null,
    val price: Double,
    @SerialName("created_at") val createdAt: Long,
    @SerialName("updated_at") val updatedAt: Long
)
```

#### 3. DynamoDB Client (`utils/DynamoDBClient.kt`)

Abstraction layer using AWS SDK v2 Enhanced Client:
- `createItem()` - Create new item with validation
- `getItem()` - Retrieve item by ID
- `updateItem()` - Update existing item with validation
- `deleteItem()` - Delete item
- `listItems()` - Scan items with limit
- **Enhanced Client** - Type-safe DynamoDB operations
- **AttributeValue conversion** - Seamless Kotlin/DynamoDB mapping

#### 4. Metrics Collector (`utils/MetricsCollector.kt`)

JVM performance monitoring:
- Memory usage (heap used, max, total)
- Cold start detection and tracking
- Request counting
- Uptime calculation
- JVM version and Kotlin version
- Lambda context metadata

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TABLE_NAME` | DynamoDB table name | `dev-benchmark-items` | Yes |
| `AWS_REGION` | AWS region | `us-east-1` | Yes |
| `DYNAMODB_ENDPOINT` | DynamoDB endpoint (LocalStack) | - | No |
| `RUNTIME_NAME` | Runtime identifier | `kotlin` | No |
| `KTOR_ENV` | Ktor environment | `dev` | No |
| `ENVIRONMENT` | Environment name | `prod` | No |
| `LOG_LEVEL` | Logging level | `INFO` | No |

### Local Development

```bash
export TABLE_NAME=dev-benchmark-items
export AWS_REGION=us-east-1
export DYNAMODB_ENDPOINT=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export KTOR_ENV=dev
export ENVIRONMENT=dev
export LOG_LEVEL=DEBUG
```

### AWS Lambda

Environment variables are set automatically by the CDK deployment in `cdk/lib/lambda-stack.ts`.

## Performance Characteristics

### Cold Start

- **Average**: 800-1500ms
- **Best Case**: 600-1000ms
- **Worst Case**: 1500-2500ms

**Factors**:
- JVM initialization overhead
- JAR size (25-35MB)
- Class loading
- Lambda memory allocation (1024MB recommended)
- Dependency initialization

**Optimization Tips:**
- Use AWS Lambda SnapStart (Java 11+) for instant startup
- Increase memory allocation (more CPU = faster init)
- Use GraalVM Native Image for ~100ms cold starts
- Minimize dependency footprint
- Use lazy initialization where possible

### Warm Latency

- **p50**: 150-300ms
- **p95**: 300-500ms
- **p99**: 500-800ms

**Factors**:
- DynamoDB performance
- Business logic complexity
- Garbage collection
- Network latency

### Memory Usage

- **Baseline**: 200-300 MB
- **Under Load**: 250-350 MB
- **Recommended Allocation**: 1024 MB (Kotlin/JVM needs more memory)
- **GC Overhead**: Moderate (JVM garbage collection)

### Throughput

- **Single Instance**: 80-200 requests/second
- **Concurrent Lambdas**: Scales automatically to thousands/second
- **Coroutine Efficiency**: Excellent for I/O-bound operations

### Cost Implications

- **Cost per 1M requests** (1024MB, 400ms avg): ~$6.87
- **Most expensive runtime** in this benchmark
- **3.7x more expensive** than Go
- **3.7x more expensive** than Python
- **Trade-off**: Developer productivity vs. cost

## Deployment

### Build for Lambda

```bash
# From project root
cd scripts
./build-lambdas.sh

# Or build Kotlin Lambda only
cd lambdas/kotlin
./gradlew clean shadowJar
```

### Deploy with CDK

```bash
# From project root
cd cdk
npm install
npm run cdk deploy

# The Kotlin Lambda will be deployed as part of the stack
```

### Manual Deployment

```bash
# Build fat JAR
./gradlew clean shadowJar

# Create deployment package
cd build/libs
zip lambda.zip bootstrap.jar

# Upload to Lambda
aws lambda update-function-code \
  --function-name multi-runtime-api-kotlin \
  --zip-file fileb://lambda.zip
```

## Monitoring and Debugging

### CloudWatch Logs

```bash
# View recent logs
aws logs tail /aws/lambda/multi-runtime-api-kotlin --follow

# Filter for errors
aws logs filter-pattern /aws/lambda/multi-runtime-api-kotlin \
  --filter-pattern "ERROR"

# View specific time range
aws logs filter-pattern /aws/lambda/multi-runtime-api-kotlin \
  --start-time 2025-01-09T00:00:00Z \
  --end-time 2025-01-09T23:59:59Z
```

### Structured Logging

Logging is configured in `src/main/resources/logback.xml`:

```xml
<root level="INFO">
    <appender-ref ref="STDOUT"/>
</root>
```

Change log level:
```bash
export LOG_LEVEL=DEBUG
./gradlew run
```

### Metrics Endpoint

Access runtime metrics:

```bash
curl http://localhost:8003/metrics
```

Response:
```json
{
  "success": true,
  "data": {
    "runtime": "kotlin",
    "kotlin_version": "1.9.21",
    "jvm_version": "17.0.x",
    "memory": {
      "heap_used_mb": 180.5,
      "heap_max_mb": 1024.0,
      "total_mb": 256.0
    },
    "cold_start": false,
    "uptime_seconds": 3600,
    "request_count": 1250
  }
}
```

### Debug Mode

Enable debug logging:

```bash
export LOG_LEVEL=DEBUG
export KTOR_ENV=dev
./gradlew run
```

## Common Issues and Solutions

### Issue: Gradle Build Fails

**Problem**: `Could not resolve dependencies`

**Solution**: Refresh dependencies
```bash
./gradlew build --refresh-dependencies

# Or clean Gradle cache
rm -rf ~/.gradle/caches
./gradlew clean build
```

### Issue: JAR Size Too Large

**Problem**: Bootstrap JAR is >50MB

**Solution**: Analyze and minimize dependencies
```bash
# Check JAR size
ls -lh build/libs/bootstrap.jar

# Analyze dependencies
./gradlew dependencies

# Exclude unnecessary transitive dependencies in build.gradle.kts
configurations.all {
    exclude(group = "org.slf4j", module = "slf4j-simple")
}
```

### Issue: Cold Start Too Slow

**Problem**: Lambda takes 2-3 seconds to cold start

**Solution**: Use Lambda SnapStart
```kotlin
// In CDK stack (for Java 11+)
snapStart: lambda.SnapStartConf.ON_PUBLISHED_VERSIONS
```

Or use GraalVM Native Image:
```bash
# Add GraalVM plugin to build.gradle.kts
./gradlew nativeCompile
```

### Issue: Out of Memory

**Problem**: `java.lang.OutOfMemoryError: Java heap space`

**Solution**: Increase Lambda memory
```kotlin
// In CDK stack
memorySize: 1536 // Increase from 1024MB
```

### Issue: DynamoDB Connection Error

**Problem**: `Unable to execute HTTP request: Connect to dynamodb...`

**Solution**: Check LocalStack and endpoint
```bash
docker compose ps localstack
# Should show "running (healthy)"

# Set endpoint for LocalStack
export DYNAMODB_ENDPOINT=http://localhost:4566
```

### Issue: Port Already in Use

**Problem**: `Bind failed: Address already in use`

**Solution**: Kill process using port 8003
```bash
# Find process
lsof -i :8003

# Kill process
kill -9 <PID>
```

## Best Practices

### 1. Use Data Classes

Leverage Kotlin data classes for immutable DTOs:

```kotlin
@Serializable
data class ItemCreate(
    val name: String,
    val description: String? = null,
    val price: Double
)
```

### 2. Null Safety

Use Kotlin's null safety features:

```kotlin
val description: String? = item.description
val upperDescription = description?.uppercase() ?: "NO DESCRIPTION"
```

### 3. Extension Functions

Use extension functions for cleaner code:

```kotlin
fun ApplicationCall.respondSuccess(data: Any, message: String) {
    respond(ItemResponse(success = true, data = data, message = message))
}
```

### 4. Coroutines

Leverage coroutines for async operations:

```kotlin
suspend fun getItemAsync(id: String): Item? = withContext(Dispatchers.IO) {
    dynamoDBClient.getItem(id)
}
```

### 5. Sealed Classes for Errors

Use sealed classes for type-safe error handling:

```kotlin
sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(val message: String) : Result<Nothing>()
}
```

### 6. Scope Functions

Use scope functions for cleaner code:

```kotlin
item?.let { existingItem ->
    existingItem.copy(
        name = updateData.name ?: existingItem.name,
        price = updateData.price ?: existingItem.price
    )
}
```

## GraalVM Native Image (Advanced)

For the best cold start performance (~50-100ms), compile to native image:

### 1. Install GraalVM

```bash
# Using SDKMAN
sdk install java 21.0.1-graal
sdk use java 21.0.1-graal

# Verify
java -version
# Should show GraalVM
```

### 2. Configure Native Image Plugin

Add to `build.gradle.kts`:

```kotlin
plugins {
    id("org.graalvm.buildtools.native") version "0.9.28"
}

graalvmNative {
    binaries {
        named("main") {
            imageName.set("bootstrap")
            mainClass.set("com.vibtellect.benchmark.ApplicationKt")
            buildArgs.add("--no-fallback")
            buildArgs.add("-H:+ReportExceptionStackTraces")
        }
    }
}
```

### 3. Build Native Image

```bash
# Build native executable
./gradlew nativeCompile

# Test locally
./build/native/nativeCompile/bootstrap
```

### 4. Deploy Native Image

```bash
# Package for Lambda (custom runtime)
cd build/native/nativeCompile
zip lambda.zip bootstrap

# Upload
aws lambda update-function-code \
  --function-name multi-runtime-api-kotlin \
  --zip-file fileb://lambda.zip
```

**Benefits:**
- **Cold Start**: ~50-100ms (vs. 800-1500ms)
- **Memory**: ~50-80MB (vs. 200-300MB)
- **Cost**: Similar to Go runtime

**Limitations:**
- Not all libraries support native image
- Requires additional configuration
- Build time is longer

## Contributing

### Code Style

This project follows:
- **Kotlin coding conventions** - Official Kotlin style guide
- **ktlint** - Kotlin linter and formatter
- **detekt** - Static code analysis
- **Meaningful names** - Clear, descriptive identifiers

### Testing Requirements

- All new features must have tests
- Maintain 85%+ coverage
- Use descriptive test names
- Test both success and error paths
- Use Ktor testing DSL for routes

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Ensure all tests pass (`./gradlew test`)
5. Run linting (`./gradlew ktlintCheck detekt`)
6. Format code (`./gradlew ktlintFormat`)
7. Submit a pull request

## Resources

- [Ktor Documentation](https://ktor.io/docs/)
- [Kotlin Documentation](https://kotlinlang.org/docs/home.html)
- [AWS SDK for Kotlin](https://aws.amazon.com/sdk-for-kotlin/)
- [AWS Lambda with Kotlin](https://docs.aws.amazon.com/lambda/latest/dg/lambda-kotlin.html)
- [kotlinx.serialization](https://github.com/Kotlin/kotlinx.serialization)
- [GraalVM Native Image](https://www.graalvm.org/latest/reference-manual/native-image/)

## License

This project is part of the Multi-Runtime API Benchmark portfolio project.

## Support

For issues and questions:
- Check the [main project README](../../README.md)
- Review the [troubleshooting guide](../../docs/GETTING_STARTED.md#troubleshooting)
- Open an issue on GitHub

---

**Runtime**: Java 17 (Kotlin 1.9.21)
**Framework**: Ktor 2.3
**Performance**: ~1000ms cold start, ~250ms warm latency
**Cost**: $6.87 per million requests (1024MB memory)
**Test Coverage**: 85%+ (165+ tests)
**JAR Size**: ~25-35MB (fat JAR)

# Kotlin Lambda - Multi-Runtime API Benchmark

Kotlin Lambda implementation using the Ktor framework.

## Tech Stack

- **Language**: Kotlin 1.9.21
- **Framework**: Ktor 2.3
- **Build Tool**: Gradle 8.5
- **Lambda Integration**: AWS Lambda Java Core
- **AWS SDK**: AWS SDK for Java v2 (DynamoDB Enhanced Client)
- **Serialization**: kotlinx.serialization

## Project Structure

```
kotlin/
├── src/main/kotlin/com/vibtellect/benchmark/
│   ├── Application.kt              # Main application and routes
│   ├── models/
│   │   └── Item.kt                 # Data models
│   └── utils/
│       ├── DynamoDBClient.kt       # DynamoDB client
│       └── MetricsCollector.kt     # Metrics collector
├── src/main/resources/
│   └── logback.xml                 # Logging configuration
├── build.gradle.kts                # Gradle build script
├── settings.gradle.kts             # Gradle settings
└── README.md
```

## Building

### Using Gradle

```bash
# Build fat JAR
./gradlew shadowJar

# Build and run tests
./gradlew test

# Clean build
./gradlew clean build

# Prepare Lambda package
./gradlew prepareLambda
```

The build produces `build/libs/bootstrap.jar` ready for Lambda deployment.

### Manual Build

```bash
# First time setup
gradle wrapper

# Then build
./gradlew shadowJar
```

## Local Testing

```bash
# Run locally
./gradlew run

# Or using the built JAR
java -jar build/libs/bootstrap.jar
```

Then test with curl:
```bash
curl http://localhost:8080/health
```

## Dependencies

Key dependencies (managed by Gradle):
- `io.ktor:ktor-server-*` - Ktor web framework
- `software.amazon.awssdk:dynamodb` - AWS SDK v2
- `kotlinx-serialization-json` - JSON serialization
- `kotlin-logging` - Kotlin logging wrapper
- `aws-lambda-java-core` - Lambda runtime

All dependencies are automatically managed by Gradle.

## API Endpoints

All endpoints from the main API are supported:

- `GET /health` - Health check
- `GET /kotlin/health` - Kotlin-specific health check
- `GET /metrics` - Runtime metrics
- `POST /items` - Create item
- `GET /items` - List items
- `GET /items/:id` - Get item
- `PUT /items/:id` - Update item
- `DELETE /items/:id` - Delete item

## Environment Variables

- `TABLE_NAME` - DynamoDB table name (default: `dev-benchmark-items`)
- `RUNTIME_NAME` - Runtime identifier (default: `kotlin`)
- `KTOR_ENV` - Ktor environment (default: `dev`)
- `ENVIRONMENT` - Environment: `dev`, `staging`, `prod`

## Testing

```bash
# Run all tests
./gradlew test

# With detailed output
./gradlew test --info

# Continuous testing
./gradlew test --continuous

# Generate test report
./gradlew test
open build/reports/tests/test/index.html
```

## Performance Characteristics

**Pros:**
- Fast execution (compiled to JVM bytecode)
- Excellent type safety
- Modern, expressive syntax
- Great IDE support
- Strong ecosystem

**Cons:**
- Larger cold start than Go (~500-1000ms)
- Higher memory usage than Go
- JVM overhead
- Fat JAR can be large (20-30MB)

### Optimization Options

For better cold start performance, consider:
1. **GraalVM Native Image** (advanced):
   ```bash
   # Requires additional configuration
   ./gradlew nativeCompile
   ```

2. **ProGuard/R8** for JAR size reduction
3. **AWS Lambda SnapStart** (Java 11+)

## Deployment

The Lambda function is deployed as part of the CDK stack:

```bash
cd ../../cdk
npx cdk deploy MultiRuntimeBenchmarkKotlinStack
```

## Code Quality

```bash
# Format code (if ktlint plugin added)
./gradlew ktlintFormat

# Check code style
./gradlew ktlintCheck

# Run detekt (static analysis)
./gradlew detekt
```

## Logging

Logs are configured in `src/main/resources/logback.xml`:

```xml
<root level="INFO">
    <appender-ref ref="STDOUT"/>
</root>
```

To change log level, set environment variable:
```bash
LOG_LEVEL=DEBUG ./gradlew run
```

## Troubleshooting

### Gradle issues
```bash
# Clean and rebuild
./gradlew clean build

# Clear Gradle cache
rm -rf ~/.gradle/caches

# Re-download dependencies
./gradlew build --refresh-dependencies
```

### Lambda cold start issues
- Consider using AWS Lambda SnapStart
- Optimize dependency size
- Use lazy initialization where possible

### Out of Memory
Increase Lambda memory:
```kotlin
// In CDK stack
memorySize: 1024 // Increase from 512MB
```

### JAR too large
```bash
# Check JAR size
ls -lh build/libs/bootstrap.jar

# Analyze dependencies
./gradlew dependencies

# Exclude unnecessary dependencies in build.gradle.kts
```

## GraalVM Native Image (Advanced)

For the best cold start performance, compile to native image:

1. Install GraalVM:
```bash
sdk install java 21.0.1-graal
sdk use java 21.0.1-graal
```

2. Add GraalVM plugin to `build.gradle.kts`:
```kotlin
plugins {
    id("org.graalvm.buildtools.native") version "0.9.28"
}
```

3. Build native image:
```bash
./gradlew nativeCompile
```

Note: Native image requires additional configuration and not all libraries are compatible.

## Contributing

Follow Kotlin best practices:
- Use idiomatic Kotlin
- Prefer immutability
- Use data classes for DTOs
- Leverage coroutines for async operations
- Write tests for new functionality
- Use meaningful names

## Resources

- [Ktor Documentation](https://ktor.io/)
- [Kotlin Documentation](https://kotlinlang.org/docs/home.html)
- [AWS SDK for Kotlin](https://aws.amazon.com/sdk-for-kotlin/)
- [Lambda with Kotlin](https://docs.aws.amazon.com/lambda/latest/dg/lambda-kotlin.html)

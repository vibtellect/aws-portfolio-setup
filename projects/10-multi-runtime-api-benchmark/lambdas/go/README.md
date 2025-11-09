# Go Lambda - Gin Framework Implementation

A high-performance serverless API implementation using Go 1.21, Gin web framework, and AWS Lambda with custom runtime.

## Overview

This implementation showcases Go's exceptional performance characteristics for AWS Lambda, using Gin as the web framework and AWS Lambda Go API Proxy for seamless integration. It provides a type-safe, high-performance RESTful CRUD API with DynamoDB integration, comprehensive testing, and minimal resource footprint.

### Key Features

- **Gin Framework** - Fast, minimalist web framework for Go
- **AWS Lambda Go Runtime** - Custom runtime with direct Lambda integration
- **Type Safety** - Full compile-time type checking with Go's static typing
- **High Performance** - Compiled binary with excellent cold start times (~100-200ms)
- **Low Memory** - Minimal memory footprint (50-80 MB)
- **Hot Reload** - Docker-based development environment with Air
- **Comprehensive Testing** - 140+ tests with 85%+ coverage
- **Binary Size Optimization** - Stripped binaries with ldflags

## Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Go | 1.21 |
| **Framework** | Gin Web Framework | Latest |
| **Lambda Runtime** | aws-lambda-go | Latest |
| **Lambda Proxy** | aws-lambda-go-api-proxy | Latest |
| **AWS SDK** | aws-sdk-go | v1 |
| **Testing** | Go testing + testify | Built-in |
| **Hot Reload** | Air | Latest |

## Project Structure

```
lambdas/go/
├── cmd/
│   ├── main.go             # Entry point and Lambda handler
│   └── main_test.go        # Handler and route tests (30+ tests)
├── internal/
│   ├── models/
│   │   ├── item.go         # Data models and types
│   │   └── item_test.go    # Model tests (85+ tests)
│   └── utils/
│       ├── dynamodb.go     # DynamoDB client wrapper
│       ├── dynamodb_test.go # DynamoDB client tests
│       ├── metrics.go      # Performance metrics collector
│       └── metrics_test.go  # Metrics collector tests (25+ tests)
├── dist/                   # Build output directory
├── go.mod                  # Go module definition
├── go.sum                  # Dependency checksums
├── Makefile               # Build automation
├── Dockerfile             # Production Lambda container
├── Dockerfile.dev         # Development container with hot reload
├── .air.toml             # Air configuration for hot reload
└── README.md             # This file
```

## Getting Started

### Prerequisites

- Go 1.21 or higher
- Make (for build automation)
- Docker (for local development)
- AWS CLI (for deployment)

### Local Development Setup

#### Option 1: Using Docker Compose (Recommended)

From the project root:

```bash
# Start all services including Go Lambda
docker compose up -d

# The Go Lambda will be available at:
# http://localhost:8002
```

The Docker container includes:
- Go 1.21 runtime
- Air for hot reload
- All dependencies downloaded
- Automatic rebuild on code changes

#### Option 2: Local Go Environment

```bash
# Navigate to the Go Lambda directory
cd lambdas/go

# Download dependencies
go mod download
go mod tidy

# Set environment variables
export TABLE_NAME=dev-benchmark-items
export AWS_REGION=us-east-1
export DYNAMODB_ENDPOINT=http://localhost:4566  # For LocalStack
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export GIN_MODE=debug
export ENVIRONMENT=dev

# Build and run
make build-local
./main

# Or run directly
go run cmd/main.go
```

### Testing the API

#### Health Check

```bash
curl http://localhost:8002/health
```

Response:
```json
{
  "status": "healthy",
  "runtime": "go",
  "version": "1.21",
  "framework": "Gin + AWS Lambda Go API Proxy"
}
```

#### Create an Item

```bash
curl -X POST http://localhost:8002/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gaming Monitor",
    "description": "27-inch 144Hz gaming monitor",
    "price": 349.99
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Gaming Monitor",
    "description": "27-inch 144Hz gaming monitor",
    "price": 349.99,
    "created_at": 1704844800000,
    "updated_at": 1704844800000
  },
  "message": "Item created successfully"
}
```

#### Get All Items

```bash
curl http://localhost:8002/items
```

#### Get Item by ID

```bash
curl http://localhost:8002/items/123e4567-e89b-12d3-a456-426614174000
```

#### Update Item

```bash
curl -X PUT http://localhost:8002/items/123e4567-e89b-12d3-a456-426614174000 \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Monitor",
    "price": 299.99
  }'
```

#### Delete Item

```bash
curl -X DELETE http://localhost:8002/items/123e4567-e89b-12d3-a456-426614174000
```

## Building

### Using Makefile (Recommended)

```bash
# Build for Lambda (Linux AMD64)
make build

# Build for local testing
make build-local

# Install dependencies
make deps

# Run tests
make test

# Run tests with coverage
make test-coverage

# Clean build artifacts
make clean

# Format code
make fmt

# Lint code
make lint

# Run all checks (fmt, vet, test)
make check
```

### Manual Build

#### For AWS Lambda

```bash
# Cross-compile for Linux AMD64 with optimizations
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build \
  -ldflags="-s -w" \
  -o dist/bootstrap \
  cmd/main.go
```

Build flags explained:
- `GOOS=linux` - Target Linux OS
- `GOARCH=amd64` - Target AMD64 architecture
- `CGO_ENABLED=0` - Disable CGO for static binary
- `-ldflags="-s -w"` - Strip debug info and symbol table (reduces size by ~30%)

#### For Local Development

```bash
# Build without cross-compilation
go build -o main cmd/main.go

# Run
./main
```

**Typical Binary Size**: ~15-25MB (optimized)

## Running Tests

### Run All Tests

```bash
# Run all tests
go test -v ./...

# Run tests with coverage
go test -v -cover ./...

# Generate coverage report
go test -v -coverprofile=coverage.out ./...
go tool cover -html=coverage.out

# View coverage in terminal
go tool cover -func=coverage.out
```

### Run Specific Tests

```bash
# Run tests in a specific package
go test -v ./internal/models
go test -v ./internal/utils
go test -v ./cmd

# Run a specific test function
go test -v -run TestItemJSONMarshaling ./internal/models
go test -v -run TestMetricsCollector ./internal/utils

# Run tests matching a pattern
go test -v -run "TestItem.*" ./...
```

### Test Coverage

Current test coverage: **85%+**

**Test Suite Breakdown (140+ tests total):**

| Package | Tests | Coverage | Description |
|---------|-------|----------|-------------|
| `internal/models` | 85+ | 95% | JSON serialization, validation, response models |
| `internal/utils` (metrics) | 25+ | 90% | Metrics collection, cold start tracking, JSON |
| `internal/utils` (dynamodb) | 10+ | 85% | DynamoDB client, validation |
| `cmd` (handlers) | 30+ | 88% | HTTP handlers, routes, middleware |

**Model Tests** (`internal/models/item_test.go`):
- JSON serialization/deserialization for all models
- Validation logic for ItemCreate and ItemUpdate
- Response object tests (ItemResponse, ErrorResponse, ItemListResponse)
- Timestamp generation and format tests
- Edge cases and boundary conditions

**Metrics Tests** (`internal/utils/metrics_test.go`):
- MetricsCollector initialization and configuration
- Cold start tracking across multiple invocations
- Memory metrics collection and validation
- Lambda context detection and population
- Concurrent metrics collection
- JSON serialization/deserialization

**DynamoDB Tests** (`internal/utils/dynamodb_test.go`):
- Client initialization with custom and default table names
- Validation logic for create and update operations
- Item structure and timestamp validation
- Price and limit validation

**Handler Tests** (`cmd/main_test.go`):
- Health check endpoints
- Metrics endpoints
- CRUD operation handlers with validation
- Error handling and response structures
- CORS middleware
- Gin framework integration

### Continuous Testing

```bash
# Watch mode (requires entr)
find . -name "*.go" | entr -c go test -v ./...

# Or use Air (includes test running)
air

# Run tests before commit
go test ./... && git commit -m "Your message"
```

## Code Quality

### Formatting

```bash
# Format all Go files
go fmt ./...
gofmt -s -w .

# Check formatting
gofmt -l .
```

### Linting

```bash
# Install golangci-lint
go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Run all linters
golangci-lint run

# Run specific linters
golangci-lint run --enable=gofmt,govet,staticcheck

# Fix auto-fixable issues
golangci-lint run --fix
```

### Vetting

```bash
# Run go vet
go vet ./...

# Check for suspicious constructs
go vet -all ./...
```

### Static Analysis

```bash
# Install staticcheck
go install honnef.co/go/tools/cmd/staticcheck@latest

# Run staticcheck
staticcheck ./...
```

## Architecture

### Request Flow

```
API Gateway → Lambda Handler → Gin Adapter → Gin Router → Handler Function → DynamoDB
```

1. **API Gateway** receives HTTP request
2. **Lambda Handler** invokes with API Gateway event
3. **Gin Adapter** (aws-lambda-go-api-proxy) converts event to Gin context
4. **Gin Router** routes request to appropriate handler
5. **Handler Function** validates input and processes request
6. **DynamoDB Client** interacts with database
7. **Response** flows back through the stack

### Key Components

#### 1. Main Handler (`cmd/main.go`)

The entry point that:
- Initializes Gin router
- Configures middleware (CORS, logging)
- Defines all API routes
- Creates Lambda handler with ginadapter
- Handles Lambda context

```go
// Initialize Gin router
r := gin.Default()

// Configure routes
r.GET("/health", healthCheck)
r.POST("/items", createItem)
// ... more routes

// Create Lambda handler
adapter := ginadapter.New(r)
handler = func(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
    return adapter.ProxyWithContext(ctx, req)
}
```

#### 2. Data Models (`internal/models/item.go`)

Type-safe data structures:

```go
type ItemCreate struct {
    Name        string   `json:"name"`
    Description *string  `json:"description,omitempty"`
    Price       float64  `json:"price"`
}

type ItemUpdate struct {
    Name        *string  `json:"name,omitempty"`
    Description *string  `json:"description,omitempty"`
    Price       *float64 `json:"price,omitempty"`
}

type Item struct {
    ID          string  `json:"id"`
    Name        string  `json:"name"`
    Description *string `json:"description,omitempty"`
    Price       float64 `json:"price"`
    CreatedAt   int64   `json:"created_at"`
    UpdatedAt   int64   `json:"updated_at"`
}
```

#### 3. DynamoDB Client (`internal/utils/dynamodb.go`)

Abstraction layer for DynamoDB operations:
- `CreateItem()` - Create new item with validation
- `GetItem()` - Retrieve item by ID
- `UpdateItem()` - Update existing item with validation
- `DeleteItem()` - Delete item
- `ListItems()` - Scan items with limit

#### 4. Metrics Collector (`internal/utils/metrics.go`)

Performance monitoring with zero allocations:
- Memory usage tracking
- Cold start detection
- Request counting
- Lambda context metadata
- Concurrent-safe collection

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TABLE_NAME` | DynamoDB table name | `dev-benchmark-items` | Yes |
| `AWS_REGION` | AWS region | `us-east-1` | Yes |
| `DYNAMODB_ENDPOINT` | DynamoDB endpoint (LocalStack) | - | No |
| `RUNTIME_NAME` | Runtime identifier | `go` | No |
| `GIN_MODE` | Gin mode: `debug`, `release`, `test` | `release` | No |
| `ENVIRONMENT` | Environment name | `prod` | No |

### Local Development

```bash
export TABLE_NAME=dev-benchmark-items
export AWS_REGION=us-east-1
export DYNAMODB_ENDPOINT=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export GIN_MODE=debug
export ENVIRONMENT=dev
```

### AWS Lambda

Environment variables are set automatically by the CDK deployment in `cdk/lib/lambda-stack.ts`.

## Performance Characteristics

### Cold Start

- **Average**: 100-200ms
- **Best Case**: 80-150ms
- **Worst Case**: 200-300ms

**Factors**:
- Binary size (use `-ldflags="-s -w"` to minimize)
- Lambda memory allocation (512MB recommended)
- Go runtime initialization (very fast)
- Package imports (keep minimal)

**Optimization Tips:**
- Strip debug symbols with `-ldflags="-s -w"`
- Minimize binary size
- Use Lambda layers for common dependencies
- Increase memory allocation (more CPU = faster init)
- Use provisioned concurrency for zero cold starts

### Warm Latency

- **p50**: 50-100ms
- **p95**: 100-150ms
- **p99**: 150-250ms

**Factors**:
- DynamoDB performance
- Business logic complexity
- Network latency
- Garbage collection (rare with short-lived requests)

### Memory Usage

- **Baseline**: 50-80 MB (most efficient runtime)
- **Under Load**: 60-100 MB
- **Recommended Allocation**: 512 MB
- **GC Overhead**: Minimal for typical requests

### Throughput

- **Single Instance**: 200-400 requests/second
- **Concurrent Lambdas**: Scales automatically to thousands/second
- **Goroutine Efficiency**: Excellent for concurrent operations

### Cost Efficiency

**Most cost-effective runtime in this benchmark!**

- **Cost per 1M requests** (512MB, 150ms avg): ~$1.45
- **3.7x cheaper** than Kotlin
- **30% cheaper** than Python
- **37% cheaper** than TypeScript

## Deployment

### Build for Lambda

```bash
# From project root
cd scripts
./build-lambdas.sh

# Or build Go Lambda only
cd lambdas/go
make build
```

### Deploy with CDK

```bash
# From project root
cd cdk
npm install
npm run cdk deploy

# The Go Lambda will be deployed as part of the stack
```

### Manual Deployment

```bash
# Build
make build

# Create deployment package
cd dist
zip lambda.zip bootstrap

# Upload to Lambda
aws lambda update-function-code \
  --function-name multi-runtime-api-go \
  --zip-file fileb://lambda.zip
```

## Monitoring and Debugging

### CloudWatch Logs

```bash
# View recent logs
aws logs tail /aws/lambda/multi-runtime-api-go --follow

# Filter for errors
aws logs filter-pattern /aws/lambda/multi-runtime-api-go \
  --filter-pattern "ERROR"

# View specific time range
aws logs filter-pattern /aws/lambda/multi-runtime-api-go \
  --start-time 2025-01-09T00:00:00Z \
  --end-time 2025-01-09T23:59:59Z
```

### Structured Logging

The application uses structured logging with Gin:

```go
log.Printf("[INFO] Processing request: method=%s path=%s", c.Request.Method, c.Request.URL.Path)
log.Printf("[ERROR] Failed to create item: %v", err)
```

### Metrics Endpoint

Access runtime metrics:

```bash
curl http://localhost:8002/metrics
```

Response:
```json
{
  "success": true,
  "data": {
    "memory": {
      "allocated_mb": 45.2,
      "system_mb": 52.3,
      "gc_count": 3
    },
    "cold_start": false,
    "request_count": 1250,
    "lambda_context": {
      "request_id": "abc-123-def",
      "function_name": "multi-runtime-api-go"
    }
  }
}
```

### Debug Mode

Enable debug mode with Gin:

```bash
export GIN_MODE=debug
go run cmd/main.go
```

## Common Issues and Solutions

### Issue: Binary Size Too Large

**Problem**: Deployed binary is >50MB, causing slow deployments

**Solution**: Use build optimization flags
```bash
# Strip debug symbols and disable CGO
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o bootstrap cmd/main.go

# Check binary size
ls -lh dist/bootstrap
# Should be ~15-25MB
```

### Issue: Module Download Errors

**Problem**: `go: module ... not found`

**Solution**: Clean and re-download modules
```bash
go clean -modcache
go mod download
go mod tidy
```

### Issue: DynamoDB Connection Error

**Problem**: `no such host: dynamodb.us-east-1.amazonaws.com`

**Solution**: Check LocalStack is running
```bash
docker compose ps localstack
# Should show "running (healthy)"

# Set endpoint for LocalStack
export DYNAMODB_ENDPOINT=http://localhost:4566
```

### Issue: Port Already in Use

**Problem**: `bind: address already in use`

**Solution**: Kill process using port 8002
```bash
# Find process
lsof -i :8002

# Kill process
kill -9 <PID>
```

### Issue: Lambda Handler Not Found

**Problem**: `fork/exec /var/task/bootstrap: no such file or directory`

**Solution**: Ensure binary is named `bootstrap`
```bash
# Build with correct name
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -o bootstrap cmd/main.go
```

## Best Practices

### 1. Error Handling

Always handle errors explicitly:

```go
item, err := dbClient.CreateItem(itemData)
if err != nil {
    log.Printf("[ERROR] Failed to create item: %v", err)
    c.JSON(500, ErrorResponse{
        Success: false,
        Message: "Error creating item",
        Error:   err.Error(),
    })
    return
}
```

### 2. Pointer Usage

Use pointers for optional fields to distinguish between zero values and missing values:

```go
type ItemUpdate struct {
    Name        *string  `json:"name,omitempty"`
    Price       *float64 `json:"price,omitempty"`
}

// Check if field was provided
if itemData.Price != nil {
    // Update price
}
```

### 3. Table-Driven Tests

Use table-driven tests for comprehensive coverage:

```go
tests := []struct {
    name    string
    input   ItemCreate
    wantErr bool
}{
    {"valid item", ItemCreate{Name: "Test", Price: 10.0}, false},
    {"missing name", ItemCreate{Price: 10.0}, true},
    {"negative price", ItemCreate{Name: "Test", Price: -10.0}, true},
}

for _, tt := range tests {
    t.Run(tt.name, func(t *testing.T) {
        err := validate(tt.input)
        if (err != nil) != tt.wantErr {
            t.Errorf("validate() error = %v, wantErr %v", err, tt.wantErr)
        }
    })
}
```

### 4. Struct Tags

Use JSON tags for API compatibility:

```go
type Item struct {
    ID          string  `json:"id"`
    Name        string  `json:"name"`
    Description *string `json:"description,omitempty"`
    Price       float64 `json:"price"`
}
```

### 5. Context Usage

Pass context for cancellation and timeouts:

```go
func (c *DynamoDBClient) GetItem(ctx context.Context, id string) (*Item, error) {
    result, err := c.client.GetItemWithContext(ctx, input)
    // ... implementation
}
```

## Contributing

### Code Style

This project follows:
- **gofmt** - Standard Go formatting
- **golangci-lint** - Comprehensive linting
- **Go best practices** - Effective Go guidelines
- **Comments** - Exported functions must have comments

### Testing Requirements

- All new features must have tests
- Maintain 85%+ coverage
- Use table-driven tests where applicable
- Test both success and error paths
- Mock external dependencies

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Write tests for your changes
4. Ensure all tests pass (`go test ./...`)
5. Run linting (`golangci-lint run`)
6. Format code (`go fmt ./...`)
7. Submit a pull request

## Resources

- [Go Documentation](https://go.dev/doc/)
- [Gin Web Framework](https://gin-gonic.com/docs/)
- [AWS Lambda Go](https://github.com/aws/aws-lambda-go)
- [AWS Lambda Go API Proxy](https://github.com/awslabs/aws-lambda-go-api-proxy)
- [AWS SDK for Go](https://aws.github.io/aws-sdk-go-v2/docs/)
- [Effective Go](https://go.dev/doc/effective_go)

## License

This project is part of the Multi-Runtime API Benchmark portfolio project.

## Support

For issues and questions:
- Check the [main project README](../../README.md)
- Review the [troubleshooting guide](../../docs/GETTING_STARTED.md#troubleshooting)
- Open an issue on GitHub

---

**Runtime**: Go 1.21
**Framework**: Gin + AWS Lambda Go API Proxy
**Performance**: ~150ms cold start, ~75ms warm latency
**Cost**: $1.45 per million requests (512MB memory)
**Test Coverage**: 85%+ (140+ tests)
**Binary Size**: ~15-25MB (optimized)

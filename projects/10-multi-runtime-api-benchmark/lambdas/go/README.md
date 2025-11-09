# Go Lambda - Multi-Runtime API Benchmark

Go Lambda implementation using the Gin web framework.

## Tech Stack

- **Language**: Go 1.21
- **Framework**: Gin Web Framework
- **Lambda Integration**: AWS Lambda Go API Proxy
- **AWS SDK**: AWS SDK for Go v1

## Project Structure

```
go/
├── cmd/
│   └── main.go              # Entry point and Lambda handler
├── internal/
│   ├── models/
│   │   └── item.go          # Data models
│   └── utils/
│       ├── dynamodb.go      # DynamoDB client
│       └── metrics.go       # Metrics collector
├── go.mod                   # Go module definition
├── go.sum                   # Dependency checksums
├── Makefile                 # Build automation
└── README.md

## Building

### Using Makefile

```bash
# Build for Lambda
make build

# Build for local testing
make build-local

# Install dependencies
make deps

# Run tests
make test

# Clean build artifacts
make clean
```

### Manual Build

```bash
# For Lambda (Linux AMD64)
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o bootstrap cmd/main.go

# For local testing
go build -o main cmd/main.go
```

## Local Testing

```bash
# Build and run
make build-local
./main

# Or use go run
go run cmd/main.go
```

Then test with curl:
```bash
curl http://localhost:8080/health
```

## Dependencies

```bash
# Install dependencies
go mod download
go mod tidy
```

Key dependencies:
- `github.com/gin-gonic/gin` - Web framework
- `github.com/aws/aws-lambda-go` - Lambda runtime
- `github.com/awslabs/aws-lambda-go-api-proxy` - API Gateway integration
- `github.com/aws/aws-sdk-go` - AWS SDK
- `github.com/google/uuid` - UUID generation

## API Endpoints

All endpoints from the main API are supported:

- `GET /health` - Health check
- `GET /go/health` - Go-specific health check
- `GET /metrics` - Runtime metrics
- `POST /items` - Create item
- `GET /items` - List items
- `GET /items/:id` - Get item
- `PUT /items/:id` - Update item
- `DELETE /items/:id` - Delete item

## Environment Variables

- `TABLE_NAME` - DynamoDB table name (default: `dev-benchmark-items`)
- `RUNTIME_NAME` - Runtime identifier (default: `go`)
- `GIN_MODE` - Gin mode: `debug`, `release` (default: `release`)
- `ENVIRONMENT` - Environment: `dev`, `staging`, `prod`

## Testing

```bash
# Run tests
go test -v ./...

# With coverage
go test -v -cover ./...

# Generate coverage report
go test -v -coverprofile=coverage.out ./...
go tool cover -html=coverage.out
```

## Performance Characteristics

**Pros:**
- Very fast cold start (~100-200ms)
- Minimal memory footprint
- Native binary execution
- Excellent concurrency with goroutines
- Low runtime overhead

**Cons:**
- Compiled binary size (can be large)
- Less dynamic than interpreted languages
- Requires cross-compilation for Lambda

## Deployment

The Lambda function is deployed as part of the CDK stack:

```bash
cd ../../cdk
npx cdk deploy MultiRuntimeBenchmarkGoStack
```

## Code Quality

```bash
# Format code
go fmt ./...

# Lint (requires golangci-lint)
golangci-lint run

# Vet code
go vet ./...
```

## Troubleshooting

### Binary too large
```bash
# Use build flags to reduce size
go build -ldflags="-s -w" -o bootstrap cmd/main.go

# Check binary size
ls -lh bootstrap
```

### Module errors
```bash
# Clean and rebuild
go clean -modcache
go mod download
go mod tidy
```

### Lambda errors
Check CloudWatch Logs:
```bash
aws logs tail /aws/lambda/multi-runtime-benchmark-go-dev --follow
```

## Contributing

Follow Go best practices:
- Use `gofmt` for formatting
- Add comments for exported functions
- Write tests for new functionality
- Keep functions small and focused
- Use meaningful variable names

.PHONY: all build build-local clean test test-coverage deps run fmt lint

# Build for Lambda (Linux ARM64)
build:
	GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o bootstrap cmd/main.go

# Build for local testing
build-local:
	go build -o main cmd/main.go

# Install dependencies
deps:
	go mod download
	go mod tidy

# Run tests
test:
	go test -v -cover ./...

# Run tests with coverage
test-coverage:
	go test -v -coverprofile=coverage.out ./...
	go tool cover -html=coverage.out -o coverage.html

# Clean build artifacts
clean:
	rm -f bootstrap main coverage.out coverage.html

# Run locally
run:
	go run cmd/main.go

# Format code
fmt:
	go fmt ./...

# Lint code
lint:
	golangci-lint run

# Default target
all: deps build

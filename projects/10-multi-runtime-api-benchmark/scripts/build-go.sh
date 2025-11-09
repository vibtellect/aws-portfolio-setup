#!/bin/bash
set -e

echo "Building Go Lambda..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LAMBDA_DIR="$PROJECT_ROOT/lambdas/go"

cd "$LAMBDA_DIR"

# Download dependencies
echo "Downloading Go dependencies..."
go mod download
go mod tidy

# Build for Lambda (Linux AMD64)
echo "Building binary for Lambda..."
GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o bootstrap cmd/main.go

echo "Go Lambda build complete!"
echo "Binary size: $(du -h bootstrap | cut -f1)"

# Makefile for LocalStack Integration Testing
# Provides convenient shortcuts for common operations

.PHONY: help install build test test-unit test-integration localstack-start localstack-stop localstack-restart localstack-logs localstack-health localstack-test clean

# Default target
help:
	@echo "Available targets:"
	@echo "  make install              - Install dependencies"
	@echo "  make build                - Build the project"
	@echo "  make test                 - Run all tests"
	@echo "  make test-unit            - Run unit tests only"
	@echo "  make test-integration     - Run integration tests only"
	@echo ""
	@echo "LocalStack targets:"
	@echo "  make localstack-start     - Start LocalStack"
	@echo "  make localstack-stop      - Stop LocalStack"
	@echo "  make localstack-restart   - Restart LocalStack"
	@echo "  make localstack-logs      - Show LocalStack logs"
	@echo "  make localstack-health    - Check LocalStack health"
	@echo "  make localstack-test      - Start LocalStack and run integration tests"
	@echo ""
	@echo "Other targets:"
	@echo "  make clean                - Clean build artifacts and LocalStack data"
	@echo "  make lint                 - Run linter"
	@echo "  make format               - Format code"

install:
	npm install

build:
	npm run build

test:
	npm test

test-unit:
	npm test

test-integration:
	npm run test:integration

# LocalStack commands
localstack-start:
	@echo "Starting LocalStack..."
	npm run localstack:start
	@echo "Waiting for LocalStack to be ready..."
	@sleep 10
	@echo "LocalStack is ready!"

localstack-stop:
	@echo "Stopping LocalStack..."
	npm run localstack:stop

localstack-restart:
	@echo "Restarting LocalStack..."
	npm run localstack:restart

localstack-logs:
	npm run localstack:logs

localstack-health:
	@echo "Checking LocalStack health..."
	npm run localstack:health

localstack-test:
	@echo "Starting LocalStack and running integration tests..."
	npm run localstack:test

# Cleanup
clean:
	@echo "Cleaning build artifacts..."
	rm -rf lib dist coverage coverage-integration cdk.out .cdk.staging
	@echo "Cleaning LocalStack data..."
	rm -rf localstack-data
	@echo "Clean complete!"

clean-all: clean
	@echo "Removing node_modules..."
	rm -rf node_modules
	@echo "Deep clean complete!"

# Development
lint:
	npm run lint

format:
	npm run format

validate:
	npm run validate

# Quick test workflow
quick-test: build test-unit

# Full test workflow (including integration)
full-test: build test-unit localstack-test

# Development workflow
dev: clean install build test-unit
	@echo "Development setup complete!"

# CI workflow
ci: install build test-unit localstack-test
	@echo "CI pipeline complete!"

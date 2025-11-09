# Local Development Guide

This guide explains how to set up and run the Multi-Runtime API Benchmark project locally using Docker Compose and LocalStack.

## Prerequisites

- **Docker** (20.10+) and **Docker Compose** (2.0+)
- **AWS CLI** (optional, for testing)
- **awslocal** (optional, for interacting with LocalStack)

### Installing awslocal

```bash
pip install awscli-local
```

## Quick Start

### 1. Start All Services

```bash
# From project root
docker-compose up -d
```

This will start:
- **LocalStack** (port 4566) - Local AWS services
- **Python Lambda** (port 8000)
- **TypeScript Lambda** (port 8001)
- **Go Lambda** (port 8002)
- **Kotlin Lambda** (port 8003)
- **DynamoDB Admin UI** (port 8080)

### 2. Verify Services

```bash
# Check all services are running
docker-compose ps

# Check LocalStack health
curl http://localhost:4566/_localstack/health

# Check Lambda health endpoints
curl http://localhost:8000/health  # Python
curl http://localhost:8001/health  # TypeScript
curl http://localhost:8002/health  # Go
curl http://localhost:8003/health  # Kotlin
```

### 3. Explore DynamoDB

Visit http://localhost:8080 to see the DynamoDB Admin UI with your local tables and data.

### 4. Stop Services

```bash
docker-compose down

# To remove volumes as well
docker-compose down -v
```

## Service Details

### LocalStack

LocalStack provides local AWS services:
- **DynamoDB** - Database
- **API Gateway** - (if needed for integration tests)
- **Lambda** - (for deploying actual Lambda functions locally)
- **IAM** - Identity and access management
- **CloudWatch Logs** - Logging

**Endpoint:** http://localhost:4566

### Lambda Services

Each Lambda runtime runs as a standalone web server for local development:

| Runtime    | Port | Endpoint                    |
|------------|------|-----------------------------|
| Python     | 8000 | http://localhost:8000       |
| TypeScript | 8001 | http://localhost:8001       |
| Go         | 8002 | http://localhost:8002       |
| Kotlin     | 8003 | http://localhost:8003       |

### DynamoDB Table

The LocalStack initialization script creates a table:
- **Name:** `dev-benchmark-items`
- **Key:** `id` (String, Hash)
- **Sample data:** 2 items pre-populated

## Development Workflow

### Hot Reload

All Lambda services support hot reload - changes to source files will automatically restart the service:

- **Python:** Uvicorn with `--reload`
- **TypeScript:** Nodemon watching `.ts` files
- **Go:** Air for live reload
- **Kotlin:** Gradle continuous build

### Making Changes

1. Edit source files in `lambdas/{runtime}/src/`
2. Service automatically detects changes and reloads
3. Test changes immediately

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f python-lambda
docker-compose logs -f localstack

# Tail last 100 lines
docker-compose logs --tail=100 -f
```

## Testing Locally

### Using cURL

```bash
# Health check
curl http://localhost:8000/python/health

# Create item
curl -X POST http://localhost:8000/python/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Laptop","description":"For testing","price":999.99}'

# List items
curl http://localhost:8000/python/items

# Get item
curl http://localhost:8000/python/items/{item-id}

# Update item
curl -X PUT http://localhost:8000/python/items/{item-id} \
  -H "Content-Type: application/json" \
  -d '{"price":899.99}'

# Delete item
curl -X DELETE http://localhost:8000/python/items/{item-id}

# Get metrics
curl http://localhost:8000/python/metrics
```

### Using awslocal

```bash
# Scan DynamoDB table
awslocal dynamodb scan --table-name dev-benchmark-items

# Get item
awslocal dynamodb get-item \
  --table-name dev-benchmark-items \
  --key '{"id":{"S":"sample-1"}}'

# Put item
awslocal dynamodb put-item \
  --table-name dev-benchmark-items \
  --item '{
    "id":{"S":"test-123"},
    "name":{"S":"Test Item"},
    "description":{"S":"Testing"},
    "price":{"N":"19.99"},
    "created_at":{"N":"1704067200000"},
    "updated_at":{"N":"1704067200000"}
  }'
```

### Running Tests

```bash
# Python tests
docker-compose exec python-lambda pytest tests/

# TypeScript tests
docker-compose exec typescript-lambda npm test

# Go tests
docker-compose exec go-lambda go test ./...

# Kotlin tests
docker-compose exec kotlin-lambda ./gradlew test
```

## Troubleshooting

### Services Won't Start

```bash
# Check Docker is running
docker ps

# Check logs for errors
docker-compose logs

# Restart services
docker-compose restart

# Rebuild containers
docker-compose up -d --build
```

### LocalStack Not Ready

```bash
# Wait for LocalStack to be healthy
docker-compose logs localstack | grep "Ready"

# Manually check health
curl http://localhost:4566/_localstack/health | jq
```

### DynamoDB Table Not Found

```bash
# Re-run initialization script
docker-compose exec localstack bash /etc/localstack/init/ready.d/init.sh

# Or recreate table manually
awslocal dynamodb create-table \
  --table-name dev-benchmark-items \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
```

### Port Already in Use

```bash
# Find process using port
lsof -i :8000  # Or :8001, :8002, :8003, :4566

# Kill process or change ports in docker-compose.yml
```

### Container Keeps Restarting

```bash
# Check container logs
docker-compose logs {service-name}

# Check container status
docker-compose ps

# Inspect container
docker inspect benchmark-{service-name}
```

## Advanced Usage

### Running Individual Services

```bash
# Start only LocalStack and Python
docker-compose up -d localstack python-lambda

# Start specific services
docker-compose up -d localstack go-lambda
```

### Accessing Container Shell

```bash
# Python
docker-compose exec python-lambda bash

# Go
docker-compose exec go-lambda sh

# Kotlin
docker-compose exec kotlin-lambda bash
```

### Custom Environment Variables

Edit `docker-compose.yml` to add or modify environment variables:

```yaml
services:
  python-lambda:
    environment:
      - LOG_LEVEL=DEBUG
      - CUSTOM_VAR=value
```

### Data Persistence

LocalStack data is stored in `/tmp/localstack` by default. To persist across restarts:

```yaml
volumes:
  - ./localstack-data:/tmp/localstack
```

## Integration Testing

### With LocalStack

```bash
# Set AWS environment to use LocalStack
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Run integration tests
pytest tests/integration/

# Or use awslocal
awslocal dynamodb list-tables
```

### Load Testing Locally

```bash
# Install k6
brew install k6  # macOS
# or download from https://k6.io/

# Run load test against local service
k6 run scripts/load-test.js \
  --env RUNTIME=python \
  --env API_URL=http://localhost:8000
```

## Best Practices

1. **Always use Docker Compose** for local development to ensure consistency
2. **Check logs** when something doesn't work
3. **Clean up** volumes when you want a fresh start: `docker-compose down -v`
4. **Use awslocal** instead of aws when working with LocalStack
5. **Monitor resources** - LocalStack can be memory-intensive

## Resources

- [LocalStack Documentation](https://docs.localstack.cloud/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [AWS CLI Local](https://github.com/localstack/awscli-local)

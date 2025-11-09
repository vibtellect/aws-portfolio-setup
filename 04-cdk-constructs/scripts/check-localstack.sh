#!/bin/bash

# LocalStack Health Check Script
# Checks if LocalStack is running and all services are available

set -e

LOCALSTACK_ENDPOINT="${LOCALSTACK_ENDPOINT:-http://localhost:4566}"
MAX_ATTEMPTS=30
ATTEMPT=0

echo "================================================"
echo "LocalStack Health Check"
echo "================================================"
echo "Endpoint: $LOCALSTACK_ENDPOINT"
echo ""

# Check if LocalStack is reachable
echo "Checking LocalStack availability..."
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -s "$LOCALSTACK_ENDPOINT/_localstack/health" > /dev/null 2>&1; then
    echo "✓ LocalStack is reachable"
    break
  fi

  ATTEMPT=$((ATTEMPT + 1))
  if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    echo "❌ LocalStack is not reachable after $MAX_ATTEMPTS attempts"
    echo ""
    echo "Please ensure LocalStack is running:"
    echo "  docker-compose up -d"
    echo "  npm run localstack:start"
    exit 1
  fi

  echo "Waiting for LocalStack... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
  sleep 2
done

echo ""
echo "Checking service health..."

# Get health status
HEALTH_JSON=$(curl -s "$LOCALSTACK_ENDPOINT/_localstack/health")

# Parse and display service status
echo "$HEALTH_JSON" | jq -r '.services | to_entries[] | "\(.key): \(.value)"' | while read -r line; do
  SERVICE=$(echo "$line" | cut -d: -f1)
  STATUS=$(echo "$line" | cut -d: -f2 | xargs)

  if [ "$STATUS" = "available" ] || [ "$STATUS" = "running" ]; then
    echo "✓ $SERVICE: $STATUS"
  else
    echo "⚠ $SERVICE: $STATUS"
  fi
done

echo ""
echo "================================================"
echo "LocalStack is ready for integration testing!"
echo "================================================"
echo ""
echo "Run integration tests with:"
echo "  npm run test:integration"
echo ""

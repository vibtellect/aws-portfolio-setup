#!/bin/bash

# LocalStack initialization script
# This script runs after LocalStack is ready and sets up the DynamoDB table

set -e

echo "🚀 Initializing LocalStack for Multi-Runtime API Benchmark..."

# Wait for LocalStack to be fully ready
sleep 5

# Create DynamoDB table
echo "📦 Creating DynamoDB table..."

awslocal dynamodb create-table \
    --table-name dev-benchmark-items \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --provisioned-throughput \
        ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region us-east-1 \
    || echo "Table might already exist, continuing..."

# Wait for table to be active
echo "⏳ Waiting for table to be active..."
awslocal dynamodb wait table-exists --table-name dev-benchmark-items --region us-east-1

# Verify table creation
echo "✅ Verifying table..."
awslocal dynamodb describe-table --table-name dev-benchmark-items --region us-east-1 | grep TableStatus

# Add some sample data
echo "📝 Adding sample data..."

awslocal dynamodb put-item \
    --table-name dev-benchmark-items \
    --item '{
        "id": {"S": "sample-1"},
        "name": {"S": "Sample Laptop"},
        "description": {"S": "High-performance laptop for development"},
        "price": {"N": "1299.99"},
        "created_at": {"N": "1704067200000"},
        "updated_at": {"N": "1704067200000"}
    }' \
    --region us-east-1

awslocal dynamodb put-item \
    --table-name dev-benchmark-items \
    --item '{
        "id": {"S": "sample-2"},
        "name": {"S": "Wireless Mouse"},
        "description": {"S": "Ergonomic wireless mouse"},
        "price": {"N": "29.99"},
        "created_at": {"N": "1704067200000"},
        "updated_at": {"N": "1704067200000"}
    }' \
    --region us-east-1

echo "✅ LocalStack initialization complete!"
echo ""
echo "📊 DynamoDB table ready: dev-benchmark-items"
echo "🌐 LocalStack endpoint: http://localhost:4566"
echo "🔍 DynamoDB Admin UI: http://localhost:8080"
echo ""
echo "Test with: awslocal dynamodb scan --table-name dev-benchmark-items"

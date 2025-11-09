#!/bin/bash

# LocalStack Initialization Script
# This script runs when LocalStack is ready

echo "================================================"
echo "LocalStack Initialization Started"
echo "================================================"

# Set AWS CLI configuration for LocalStack
export AWS_DEFAULT_REGION=eu-central-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

# Wait for LocalStack to be fully ready
echo "Waiting for LocalStack services to be ready..."
sleep 5

# Create initial resources if needed
echo "Creating initial test resources..."

# Example: Create a test S3 bucket
awslocal s3 mb s3://test-bucket 2>/dev/null || echo "Test bucket already exists"

# Example: Create a test DynamoDB table
awslocal dynamodb create-table \
  --table-name test-table \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region eu-central-1 2>/dev/null || echo "Test table already exists"

echo "================================================"
echo "LocalStack Initialization Complete"
echo "================================================"
echo "Available services:"
echo "  - S3: http://localhost:4566"
echo "  - DynamoDB: http://localhost:4566"
echo "  - Lambda: http://localhost:4566"
echo "  - SQS: http://localhost:4566"
echo "  - SNS: http://localhost:4566"
echo "  - CloudWatch: http://localhost:4566"
echo "  - KMS: http://localhost:4566"
echo "  - API Gateway: http://localhost:4566"
echo "  - Cognito: http://localhost:4566"
echo "================================================"

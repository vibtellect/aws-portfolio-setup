#!/bin/bash
set -e

# Deployment script for Multi-Runtime API Benchmark
echo "========================================="
echo "Multi-Runtime API Benchmark Deployment"
echo "========================================="
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CDK_DIR="$PROJECT_ROOT/cdk"

# Parse arguments
ENVIRONMENT="${1:-dev}"
ALERT_EMAIL="${2:-}"

echo "Environment: $ENVIRONMENT"
if [ -n "$ALERT_EMAIL" ]; then
    echo "Alert Email: $ALERT_EMAIL"
fi
echo ""

# Build all Lambda functions
echo "Step 1: Building Lambda functions..."
bash "$SCRIPT_DIR/build-all.sh"
echo ""

# Install CDK dependencies
echo "Step 2: Installing CDK dependencies..."
cd "$CDK_DIR"
npm install
echo "✅ CDK dependencies installed"
echo ""

# Build CDK
echo "Step 3: Building CDK..."
npm run build
echo "✅ CDK built successfully"
echo ""

# Bootstrap CDK (if needed)
echo "Step 4: Checking CDK bootstrap..."
if npx cdk bootstrap --context environment="$ENVIRONMENT" 2>&1 | grep -q "already bootstrapped"; then
    echo "ℹ️  CDK already bootstrapped"
else
    echo "✅ CDK bootstrapped"
fi
echo ""

# Deploy stacks
echo "Step 5: Deploying CDK stacks..."
if [ -n "$ALERT_EMAIL" ]; then
    npx cdk deploy --all \
        --context environment="$ENVIRONMENT" \
        --context alertEmail="$ALERT_EMAIL" \
        --require-approval never
else
    npx cdk deploy --all \
        --context environment="$ENVIRONMENT" \
        --require-approval never
fi
echo ""

echo "========================================="
echo "✅ Deployment completed successfully!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Check the AWS Console for the deployed resources"
echo "2. Test the API endpoints (URLs shown above)"
echo "3. View CloudWatch Dashboard for metrics"
echo ""

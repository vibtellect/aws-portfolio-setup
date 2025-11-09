#!/bin/bash

# LocalStack Cleanup Script
# Removes all LocalStack containers, volumes, and data

set -e

echo "================================================"
echo "LocalStack Cleanup"
echo "================================================"
echo ""

# Stop LocalStack
echo "Stopping LocalStack..."
docker-compose down -v || true

# Remove LocalStack data directory
if [ -d "localstack-data" ]; then
  echo "Removing LocalStack data directory..."
  rm -rf localstack-data
fi

# Remove CDK output directories
if [ -d "cdk.out" ]; then
  echo "Removing CDK output directory..."
  rm -rf cdk.out
fi

# Prune unused Docker volumes
echo ""
read -p "Do you want to prune unused Docker volumes? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  docker volume prune -f
fi

echo ""
echo "================================================"
echo "LocalStack cleanup complete!"
echo "================================================"
echo ""
echo "To start fresh:"
echo "  npm run localstack:start"
echo ""

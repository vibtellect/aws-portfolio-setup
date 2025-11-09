#!/bin/bash
set -e

echo "Building TypeScript Lambda..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LAMBDA_DIR="$PROJECT_ROOT/lambdas/typescript"

cd "$LAMBDA_DIR"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build TypeScript
echo "Compiling TypeScript..."
npm run build

echo "TypeScript Lambda build complete!"

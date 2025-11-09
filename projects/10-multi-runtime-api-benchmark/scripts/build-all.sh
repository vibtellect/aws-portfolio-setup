#!/bin/bash
set -e

echo "========================================="
echo "Building All Lambda Functions"
echo "========================================="
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LAMBDAS_DIR="$PROJECT_ROOT/lambdas"

# Build Python Lambda
echo "📦 Building Python Lambda..."
bash "$SCRIPT_DIR/build-python.sh"
echo "✅ Python Lambda built successfully"
echo ""

# Build TypeScript Lambda
echo "📦 Building TypeScript Lambda..."
bash "$SCRIPT_DIR/build-typescript.sh"
echo "✅ TypeScript Lambda built successfully"
echo ""

# Build Go Lambda
echo "📦 Building Go Lambda..."
bash "$SCRIPT_DIR/build-go.sh"
echo "✅ Go Lambda built successfully"
echo ""

# Build Kotlin Lambda
echo "📦 Building Kotlin Lambda..."
bash "$SCRIPT_DIR/build-kotlin.sh"
echo "✅ Kotlin Lambda built successfully"
echo ""

echo "========================================="
echo "✅ All Lambda functions built successfully"
echo "========================================="

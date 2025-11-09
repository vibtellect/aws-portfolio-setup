#!/bin/bash
set -e

echo "Building Kotlin Lambda..."

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LAMBDA_DIR="$PROJECT_ROOT/lambdas/kotlin"

cd "$LAMBDA_DIR"

# Check if gradlew exists, if not use gradle
if [ -x "./gradlew" ]; then
    GRADLE_CMD="./gradlew"
else
    GRADLE_CMD="gradle"
fi

# Build with Gradle
echo "Building with Gradle..."
$GRADLE_CMD clean shadowJar

# Check if JAR was created
if [ ! -f "build/libs/bootstrap.jar" ]; then
    echo "Error: bootstrap.jar not found!"
    exit 1
fi

echo "Kotlin Lambda build complete!"
echo "JAR size: $(du -h build/libs/bootstrap.jar | cut -f1)"

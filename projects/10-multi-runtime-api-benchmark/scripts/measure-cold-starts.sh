#!/bin/bash

# Measure cold start times for all Lambda runtimes
# This script invokes Lambda functions after a period of inactivity to measure cold starts

set -e

# Configuration
REGION="${AWS_REGION:-us-east-1}"
STAGE="${STAGE:-dev}"
RESULTS_DIR="results/cold-starts"
IDLE_TIME=300  # 5 minutes idle time to ensure cold start
ITERATIONS=10  # Number of cold start measurements per runtime

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Runtimes to test
RUNTIMES=("python" "typescript" "go" "kotlin")

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Cold Start Measurement Script       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Create results directory
mkdir -p "$RESULTS_DIR"

# Timestamp for this test run
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RESULTS_FILE="$RESULTS_DIR/cold-starts-$TIMESTAMP.csv"

# Write CSV header
echo "runtime,iteration,cold_start,duration_ms,memory_used_mb,timestamp" > "$RESULTS_FILE"

# Function to get Lambda function name
get_function_name() {
    local runtime=$1
    echo "${STAGE}-benchmark-${runtime}-lambda"
}

# Function to invoke Lambda and measure cold start
measure_cold_start() {
    local runtime=$1
    local iteration=$2

    local function_name=$(get_function_name "$runtime")

    echo -e "${YELLOW}[$runtime] Iteration $iteration/$ITERATIONS${NC}"

    # Wait for cold start (first iteration) or brief pause
    if [ "$iteration" -eq 1 ]; then
        echo -e "${YELLOW}  Waiting ${IDLE_TIME}s for cold start...${NC}"
        sleep "$IDLE_TIME"
    else
        # Brief pause between iterations
        sleep 10
    fi

    # Invoke Lambda function
    local start_time=$(date +%s%3N)

    local response=$(aws lambda invoke \
        --function-name "$function_name" \
        --region "$REGION" \
        --payload '{"httpMethod":"GET","path":"/metrics","headers":{}}' \
        --log-type Tail \
        --query 'LogResult' \
        --output text \
        /tmp/lambda-response-$runtime.json 2>&1 | base64 -d || echo "")

    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))

    # Parse response for cold start indicator and memory
    local cold_start="false"
    local memory_used=0

    if [ -f "/tmp/lambda-response-$runtime.json" ]; then
        # Extract metrics from response
        cold_start=$(jq -r '.data.coldStart // false' /tmp/lambda-response-$runtime.json 2>/dev/null || echo "false")
        memory_used=$(jq -r '.data.memory.heapUsedMB // .data.memory.AllocMB // 0' /tmp/lambda-response-$runtime.json 2>/dev/null || echo "0")
    fi

    # Check Lambda logs for INIT_START (definitive cold start indicator)
    if echo "$response" | grep -q "INIT_START"; then
        cold_start="true"
    fi

    # Extract billed duration from logs
    local billed_duration=$(echo "$response" | grep "Billed Duration" | sed 's/.*Billed Duration: \([0-9]*\) ms.*/\1/' || echo "$duration")

    # Log result
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    echo "$runtime,$iteration,$cold_start,$billed_duration,$memory_used,$timestamp" >> "$RESULTS_FILE"

    # Display result
    if [ "$cold_start" == "true" ]; then
        echo -e "${RED}  ❄️  COLD START: ${billed_duration}ms (Memory: ${memory_used}MB)${NC}"
    else
        echo -e "${GREEN}  ♨️  WARM START: ${billed_duration}ms (Memory: ${memory_used}MB)${NC}"
    fi

    # Cleanup
    rm -f /tmp/lambda-response-$runtime.json
}

# Main execution
echo -e "${BLUE}Configuration:${NC}"
echo "  Region: $REGION"
echo "  Stage: $STAGE"
echo "  Idle Time: ${IDLE_TIME}s"
echo "  Iterations: $ITERATIONS per runtime"
echo "  Results: $RESULTS_FILE"
echo ""

# Test each runtime
for runtime in "${RUNTIMES[@]}"; do
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}Testing Runtime: ${runtime}${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"

    # Check if function exists
    function_name=$(get_function_name "$runtime")
    if ! aws lambda get-function --function-name "$function_name" --region "$REGION" &>/dev/null; then
        echo -e "${RED}  Function $function_name not found. Skipping...${NC}"
        continue
    fi

    # Measure cold starts
    for i in $(seq 1 $ITERATIONS); do
        measure_cold_start "$runtime" "$i"
    done

    echo ""
done

# Generate summary
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Cold Start Measurement Complete     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
echo "Results saved to: $RESULTS_FILE"
echo ""

# Display summary statistics
echo -e "${BLUE}Summary Statistics:${NC}"
echo ""

for runtime in "${RUNTIMES[@]}"; do
    # Calculate average cold start time
    cold_starts=$(grep "^$runtime," "$RESULTS_FILE" | grep ",true," || true)

    if [ -n "$cold_starts" ]; then
        count=$(echo "$cold_starts" | wc -l)
        avg_duration=$(echo "$cold_starts" | awk -F',' '{sum+=$4; count++} END {if(count>0) print sum/count; else print 0}')
        min_duration=$(echo "$cold_starts" | awk -F',' '{print $4}' | sort -n | head -1)
        max_duration=$(echo "$cold_starts" | awk -F',' '{print $4}' | sort -n | tail -1)

        echo -e "${YELLOW}$runtime:${NC}"
        echo "  Cold starts detected: $count"
        echo "  Average duration: ${avg_duration}ms"
        echo "  Min duration: ${min_duration}ms"
        echo "  Max duration: ${max_duration}ms"
        echo ""
    else
        echo -e "${YELLOW}$runtime:${NC}"
        echo "  No cold starts detected"
        echo ""
    fi
done

echo -e "${GREEN}Done!${NC}"
echo ""
echo "To visualize results, run:"
echo "  python scripts/visualize-results.py $RESULTS_FILE"

#!/bin/bash

# Master benchmark script for Multi-Runtime API Benchmark
# Orchestrates all benchmark tests: cold starts, load tests, and comparisons

set -e

# Configuration
REGION="${AWS_REGION:-us-east-1}"
STAGE="${STAGE:-dev}"
RESULTS_DIR="results"
RUNTIMES=("python" "typescript" "go" "kotlin")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
NC='\033[0m'

# Banner
echo -e "${MAGENTA}"
cat << "EOF"
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     Multi-Runtime API Benchmark Test Suite              ║
║     Comparing Python | TypeScript | Go | Kotlin         ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

MISSING_TOOLS=()

if ! command -v aws &> /dev/null; then
    MISSING_TOOLS+=("aws-cli")
fi

if ! command -v k6 &> /dev/null; then
    echo -e "${YELLOW}  ⚠️  k6 not found. Load tests will be skipped.${NC}"
    echo "     Install from: https://k6.io/docs/getting-started/installation/"
fi

if ! command -v python3 &> /dev/null; then
    MISSING_TOOLS+=("python3")
fi

if ! command -v jq &> /dev/null; then
    MISSING_TOOLS+=("jq")
fi

if [ ${#MISSING_TOOLS[@]} -gt 0 ]; then
    echo -e "${RED}Missing required tools: ${MISSING_TOOLS[*]}${NC}"
    echo "Please install them and try again."
    exit 1
fi

echo -e "${GREEN}  ✓ Prerequisites OK${NC}"
echo ""

# Create results directory
mkdir -p "$RESULTS_DIR/cold-starts"
mkdir -p "$RESULTS_DIR/load-tests"
mkdir -p "$RESULTS_DIR/comparisons"

# Timestamp for this run
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RUN_DIR="$RESULTS_DIR/run-$TIMESTAMP"
mkdir -p "$RUN_DIR"

echo -e "${BLUE}Configuration:${NC}"
echo "  Region: $REGION"
echo "  Stage: $STAGE"
echo "  Runtimes: ${RUNTIMES[*]}"
echo "  Results directory: $RUN_DIR"
echo ""

# Function to check if API Gateway is deployed
check_deployment() {
    echo -e "${BLUE}Checking API Gateway deployment...${NC}"

    # Try to get API Gateway URL from CDK outputs
    local stack_name="${STAGE}-benchmark-shared"

    if ! aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --region "$REGION" &>/dev/null; then
        echo -e "${RED}  ✗ Stack $stack_name not found${NC}"
        echo "  Please deploy the infrastructure first:"
        echo "    cd cdk && npm run deploy"
        return 1
    fi

    local api_url=$(aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --region "$REGION" \
        --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" \
        --output text 2>/dev/null || echo "")

    if [ -z "$api_url" ]; then
        echo -e "${YELLOW}  ⚠️  Could not get API URL from stack outputs${NC}"
        return 1
    fi

    echo -e "${GREEN}  ✓ API Gateway found: $api_url${NC}"
    export API_URL="$api_url"
    return 0
}

# Step 1: Check deployment
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Step 1: Verify Deployment          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

if ! check_deployment; then
    echo ""
    echo -e "${YELLOW}Deployment check failed. Some tests may not run.${NC}"
    echo "Continue anyway? (y/n)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
echo ""

# Step 2: Cold Start Measurements
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Step 2: Cold Start Measurements    ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

if [ -f "scripts/measure-cold-starts.sh" ]; then
    echo "Starting cold start measurements..."
    echo "This will take approximately 30-45 minutes..."
    echo ""

    if bash scripts/measure-cold-starts.sh; then
        # Copy results to run directory
        latest_cold_start=$(ls -t results/cold-starts/cold-starts-*.csv | head -1)
        if [ -n "$latest_cold_start" ]; then
            cp "$latest_cold_start" "$RUN_DIR/cold-starts.csv"
            echo -e "${GREEN}  ✓ Cold start results saved${NC}"
        fi
    else
        echo -e "${YELLOW}  ⚠️  Cold start measurements failed${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠️  Cold start script not found. Skipping...${NC}"
fi
echo ""

# Step 3: Load Tests
if command -v k6 &> /dev/null && [ -n "$API_URL" ]; then
    echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║  Step 3: Load Tests (k6)            ║${NC}"
    echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
    echo ""

    for runtime in "${RUNTIMES[@]}"; do
        echo -e "${YELLOW}Running load test for: $runtime${NC}"

        if k6 run \
            --env RUNTIME="$runtime" \
            --env API_URL="$API_URL" \
            --out json="$RUN_DIR/load-test-${runtime}.json" \
            scripts/load-test.js; then
            echo -e "${GREEN}  ✓ Load test complete for $runtime${NC}"
        else
            echo -e "${RED}  ✗ Load test failed for $runtime${NC}"
        fi
        echo ""

        # Brief pause between runtime tests
        sleep 5
    done
else
    echo -e "${YELLOW}Skipping load tests (k6 not installed or API not deployed)${NC}"
    echo ""
fi

# Step 4: Generate Comparison Report
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Step 4: Generate Reports            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

if [ -f "scripts/compare-results.py" ]; then
    echo "Generating comparison report..."

    if python3 scripts/compare-results.py "$RUN_DIR"; then
        echo -e "${GREEN}  ✓ Comparison report generated${NC}"
    else
        echo -e "${YELLOW}  ⚠️  Failed to generate comparison report${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠️  Comparison script not found${NC}"
fi
echo ""

# Step 5: Visualize Results
echo -e "${BLUE}╔══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Step 5: Visualize Results           ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════╝${NC}"
echo ""

if [ -f "scripts/visualize-results.py" ]; then
    echo "Generating visualizations..."

    if python3 scripts/visualize-results.py "$RUN_DIR"; then
        echo -e "${GREEN}  ✓ Visualizations generated${NC}"
    else
        echo -e "${YELLOW}  ⚠️  Failed to generate visualizations${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠️  Visualization script not found${NC}"
fi
echo ""

# Summary
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}║            Benchmark Suite Complete!                     ║${NC}"
echo -e "${GREEN}║                                                          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Results Location:${NC}"
echo "  $RUN_DIR"
echo ""
echo -e "${BLUE}Generated Files:${NC}"
ls -lh "$RUN_DIR" | tail -n +2 | awk '{print "  " $9 " (" $5 ")"}'
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. View comparison report: cat $RUN_DIR/comparison-report.md"
echo "  2. Open visualizations: open $RUN_DIR/*.png"
echo "  3. Review raw data: $RUN_DIR/*.csv $RUN_DIR/*.json"
echo ""
echo -e "${GREEN}Happy benchmarking! 🚀${NC}"

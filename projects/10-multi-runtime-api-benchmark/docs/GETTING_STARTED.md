# Getting Started with Multi-Runtime API Benchmark

This guide will walk you through setting up and running the Multi-Runtime API Benchmark project from scratch. Whether you're a beginner or experienced developer, this step-by-step guide will help you get up and running quickly.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [AWS Deployment](#aws-deployment)
- [Running Benchmarks](#running-benchmarks)
- [Understanding the Results](#understanding-the-results)
- [Next Steps](#next-steps)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Tools

Before starting, ensure you have the following installed:

1. **Git** - Version control
   ```bash
   git --version  # Should be 2.x or higher
   ```

2. **Docker & Docker Compose** - For local development
   ```bash
   docker --version         # Should be 20.x or higher
   docker compose version   # Should be 2.x or higher
   ```

3. **Node.js & npm** - For AWS CDK and benchmarking
   ```bash
   node --version  # Should be 18.x or higher
   npm --version   # Should be 9.x or higher
   ```

4. **AWS CLI** - For AWS deployment (optional for local dev)
   ```bash
   aws --version  # Should be 2.x or higher
   ```

5. **Python 3** - For visualization scripts
   ```bash
   python3 --version  # Should be 3.8 or higher
   ```

### Optional Tools

- **k6** - For load testing (install from https://k6.io/docs/get-started/installation/)
- **jq** - For JSON parsing in scripts
- **AWS Account** - Only needed for AWS deployment

### Installation Guides

If you're missing any tools, here are quick installation guides:

**macOS (using Homebrew):**
```bash
brew install git docker node awscli python3 k6 jq
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install git docker.io docker-compose nodejs npm awscli python3 python3-pip jq
```

**Windows:**
- Install Docker Desktop from https://www.docker.com/products/docker-desktop
- Install Node.js from https://nodejs.org/
- Install AWS CLI from https://aws.amazon.com/cli/
- Install Python from https://www.python.org/downloads/

## Local Development Setup

Local development uses Docker Compose and LocalStack to run everything on your machine at zero cost.

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd aws-portfolio-setup/projects/10-multi-runtime-api-benchmark
```

### Step 2: Install Dependencies

Install the benchmarking and visualization dependencies:

```bash
# Install Python dependencies for visualization
pip3 install matplotlib pandas

# Install AWS CDK CLI (optional, only for AWS deployment)
npm install -g aws-cdk

# Install k6 for load testing (follow instructions at https://k6.io/docs/get-started/installation/)
```

### Step 3: Start Local Environment

Start all services with a single command:

```bash
docker compose up -d
```

This will start:
- **LocalStack** - Local AWS services (port 4566)
- **Python Lambda** - FastAPI runtime (port 8000)
- **TypeScript Lambda** - Express runtime (port 8001)
- **Go Lambda** - Gin runtime (port 8002)
- **Kotlin Lambda** - Ktor runtime (port 8003)
- **DynamoDB Admin** - Web UI for DynamoDB (port 8080)

### Step 4: Wait for Initialization

The LocalStack initialization script will automatically create the DynamoDB table and add sample data. Wait about 30 seconds, then verify:

```bash
# Check that all services are running
docker compose ps

# Verify DynamoDB table was created
docker compose logs localstack | grep "LocalStack initialization complete"
```

### Step 5: Test the APIs

Test each runtime to ensure they're working:

```bash
# Python (FastAPI)
curl http://localhost:8000/health

# TypeScript (Express)
curl http://localhost:8001/health

# Go (Gin)
curl http://localhost:8002/health

# Kotlin (Ktor)
curl http://localhost:8003/health
```

All should return:
```json
{
  "status": "healthy",
  "runtime": "<runtime-name>",
  "timestamp": "2025-01-09T..."
}
```

### Step 6: Try CRUD Operations

Create an item in the Python runtime:

```bash
curl -X POST http://localhost:8000/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Item",
    "description": "My first item",
    "price": 99.99
  }'
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Test Item",
  "description": "My first item",
  "price": 99.99,
  "created_at": 1704844800000,
  "updated_at": 1704844800000
}
```

Retrieve all items:

```bash
curl http://localhost:8000/items
```

Get a specific item (replace with your ID):

```bash
curl http://localhost:8000/items/550e8400-e29b-41d4-a716-446655440000
```

### Step 7: Explore DynamoDB Admin UI

Open your browser and navigate to:
```
http://localhost:8080
```

You'll see a web interface where you can:
- Browse the `dev-benchmark-items` table
- View all items
- Execute queries
- Monitor table statistics

### Step 8: Hot Reload Development

All runtimes support hot reload. Try editing a file:

1. Open `lambdas/python/src/app.py`
2. Change the health check message
3. Save the file
4. Immediately test: `curl http://localhost:8000/health`
5. See your changes reflected instantly!

### Step 9: Stop the Environment

When you're done:

```bash
# Stop all services
docker compose down

# Stop and remove all data
docker compose down -v
```

## AWS Deployment

Deploy the project to your AWS account for real-world testing.

### Step 1: Configure AWS Credentials

Ensure your AWS credentials are configured:

```bash
aws configure
```

You'll need:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Output format (use `json`)

Verify your credentials:

```bash
aws sts get-caller-identity
```

### Step 2: Install CDK Dependencies

```bash
cd cdk
npm install
```

### Step 3: Bootstrap AWS CDK (First Time Only)

If this is your first time using CDK in this account/region:

```bash
npm run cdk bootstrap
```

This creates the necessary S3 buckets and roles for CDK deployments.

### Step 4: Build Lambda Functions

Build all four Lambda runtimes:

```bash
# From the project root
cd scripts
./build-lambdas.sh
```

This will:
- Install dependencies for each runtime
- Compile TypeScript, Go, and Kotlin
- Package Python code
- Create deployment artifacts in `lambdas/*/dist/`

### Step 5: Deploy Infrastructure

Deploy using the deployment script:

```bash
./deploy.sh
```

This will:
1. Build all Lambda functions
2. Deploy CDK stack
3. Run smoke tests
4. Display the API Gateway URL

**Expected output:**
```
🚀 Starting deployment...
✅ Build completed successfully
✅ Deployment completed successfully
🌐 API Gateway URL: https://abcd1234.execute-api.us-east-1.amazonaws.com/prod
✅ Smoke tests passed
```

### Step 6: Test the Deployed APIs

Use the API Gateway URL from the deployment:

```bash
export API_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com/prod"

# Test Python runtime
curl $API_URL/python/health

# Test TypeScript runtime
curl $API_URL/typescript/health

# Test Go runtime
curl $API_URL/go/health

# Test Kotlin runtime
curl $API_URL/kotlin/health
```

### Step 7: Create Items via API Gateway

```bash
# Create an item using Python Lambda
curl -X POST $API_URL/python/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Item",
    "description": "Created via API Gateway",
    "price": 149.99
  }'

# List all items
curl $API_URL/python/items

# Try the same operations with other runtimes
curl -X POST $API_URL/typescript/items -H "Content-Type: application/json" -d '{"name":"TS Item","description":"TypeScript test","price":199.99}'
curl -X POST $API_URL/go/items -H "Content-Type: application/json" -d '{"name":"Go Item","description":"Go test","price":299.99}'
curl -X POST $API_URL/kotlin/items -H "Content-Type: application/json" -d '{"name":"Kotlin Item","description":"Kotlin test","price":399.99}'
```

### Step 8: Monitor in AWS Console

1. **Lambda Console**: https://console.aws.amazon.com/lambda
   - View all 4 functions
   - Check metrics and logs
   - Monitor invocations and errors

2. **DynamoDB Console**: https://console.aws.amazon.com/dynamodb
   - Browse the items table
   - View metrics and capacity

3. **CloudWatch Console**: https://console.aws.amazon.com/cloudwatch
   - View Lambda logs
   - Check performance metrics
   - Set up alarms

### Step 9: Clean Up (Optional)

To avoid AWS charges, destroy the stack when done:

```bash
cd cdk
npm run cdk destroy
```

Confirm with `y` when prompted.

## Running Benchmarks

Now that you have the project running (locally or on AWS), run performance benchmarks.

### Step 1: Prepare for Benchmarking

Ensure you have k6 installed:

```bash
k6 version
```

For AWS benchmarking, set your API URL:

```bash
export API_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com/prod"
```

For local benchmarking:
```bash
export API_URL="http://localhost"
```

### Step 2: Run the Master Benchmark Script

Run all benchmarks with a single command:

```bash
cd scripts
./benchmark-all.sh
```

This will:
1. Measure cold starts for all 4 runtimes (takes ~25 minutes)
2. Run load tests with 10→50→100 concurrent users (takes ~5 minutes)
3. Generate comparison reports
4. Create performance visualizations

### Step 3: Run Individual Benchmarks

**Cold Start Measurement:**
```bash
./measure-cold-starts.sh
```

**Load Testing:**
```bash
k6 run load-test.js
```

**Custom Load Test:**
```bash
# 50 virtual users for 2 minutes
k6 run --vus 50 --duration 2m load-test.js

# Ramping pattern: 10→100 users over 5 minutes
k6 run --stage 1m:10,2m:50,2m:100 load-test.js
```

### Step 4: Generate Reports

Generate a comparison report from your results:

```bash
python3 compare-results.py results/
```

This creates `results/comparison-report.md` with statistics for each runtime.

### Step 5: Visualize Results

Create performance charts:

```bash
python3 visualize-results.py results/
```

This generates 6 charts in `results/charts/`:
- `cold-start-comparison.png` - Cold start times
- `latency-percentiles.png` - Response time distribution
- `throughput-comparison.png` - Requests per second
- `error-rates.png` - Error percentages
- `memory-usage.png` - Memory consumption
- `performance-dashboard.png` - Combined overview

## Understanding the Results

### Cold Start Metrics

Cold starts occur when Lambda creates a new execution environment. Lower is better.

**Typical Results:**
- **Go**: 100-200ms (fastest, compiled binary)
- **Python**: 200-400ms (fast, minimal dependencies)
- **TypeScript**: 300-500ms (moderate, Node.js overhead)
- **Kotlin/JVM**: 800-1500ms (slowest, JVM initialization)

### Latency Metrics

Response time for API requests. Lower is better.

**Key Percentiles:**
- **p50 (median)**: 50% of requests are faster than this
- **p95**: 95% of requests are faster than this (eliminates outliers)
- **p99**: 99% of requests are faster than this (worst case scenarios)

**Typical p95 Latencies:**
- **Go**: 50-100ms
- **Python**: 80-150ms
- **TypeScript**: 100-200ms
- **Kotlin**: 150-300ms

### Throughput Metrics

Requests handled per second. Higher is better.

**Typical Results (under 50 concurrent users):**
- **Go**: 200-400 req/s
- **Python**: 150-300 req/s
- **TypeScript**: 100-250 req/s
- **Kotlin**: 80-200 req/s

### Memory Usage

Memory consumed by each Lambda. Lower is better for cost.

**Typical Usage:**
- **Go**: 50-80 MB (most efficient)
- **Python**: 80-120 MB
- **TypeScript**: 100-150 MB
- **Kotlin/JVM**: 200-300 MB (highest overhead)

### Cost Implications

Based on the metrics:
- **Go**: Best cost efficiency (fast + low memory)
- **Python**: Good balance (moderate speed + memory)
- **TypeScript**: Moderate cost (balanced performance)
- **Kotlin**: Highest cost (slow cold starts + high memory)

## Next Steps

### Learn the Codebase

1. **Read the main README**: `../README.md`
2. **Explore each Lambda implementation**:
   - Python: `lambdas/python/README.md`
   - TypeScript: `lambdas/typescript/README.md`
   - Go: `lambdas/go/README.md`
   - Kotlin: `lambdas/kotlin/README.md`
3. **Study the CDK infrastructure**: `cdk/README.md`

### Customize the Project

1. **Add New Endpoints**: Extend the CRUD API with additional operations
2. **Change Database**: Replace DynamoDB with RDS, Aurora, or other services
3. **Add More Runtimes**: Try Rust, Ruby, .NET, or other Lambda runtimes
4. **Implement Caching**: Add Redis or ElastiCache for performance
5. **Add Authentication**: Implement JWT or API key authentication

### Run Tests

Each component has comprehensive tests:

```bash
# Python tests
cd lambdas/python
python -m pytest

# TypeScript tests
cd lambdas/typescript
npm test

# Go tests
cd lambdas/go
go test ./...

# Kotlin tests
cd lambdas/kotlin
./gradlew test

# CDK tests
cd cdk
npm test
```

### Set Up CI/CD

The project includes GitHub Actions workflows:
- `.github/workflows/test.yml` - Automated testing
- `.github/workflows/lint.yml` - Code quality checks
- `.github/workflows/deploy.yml` - Automated deployment

Push your code to GitHub to trigger the workflows automatically.

### Contribute

Found a bug or want to add a feature? See `../CONTRIBUTING.md` for guidelines.

## Troubleshooting

### Docker Issues

**Problem**: `docker compose up` fails with "port already in use"

**Solution**: Check for conflicting services
```bash
# Find what's using port 8000
lsof -i :8000

# Kill the process or stop other services
docker compose down
```

**Problem**: Services don't start or fail health checks

**Solution**: Check logs
```bash
docker compose logs <service-name>

# Example
docker compose logs python-lambda
```

### AWS Deployment Issues

**Problem**: CDK bootstrap fails with "AccessDenied"

**Solution**: Check your AWS credentials have sufficient permissions
```bash
aws sts get-caller-identity
```

Required permissions:
- CloudFormation (create/update stacks)
- Lambda (create/update functions)
- API Gateway (create APIs)
- DynamoDB (create tables)
- IAM (create roles)
- S3 (CDK bootstrap bucket)

**Problem**: Lambda deployment fails with "Code size too large"

**Solution**: The build step may have failed. Rebuild:
```bash
cd scripts
./build-lambdas.sh
```

### Benchmarking Issues

**Problem**: k6 not found

**Solution**: Install k6 following https://k6.io/docs/get-started/installation/

**Problem**: Cold start measurement takes too long

**Solution**: Reduce the iteration count in `measure-cold-starts.sh`:
```bash
# Edit the script
ITERATIONS=5  # Instead of 10
```

**Problem**: Visualization fails with "No module named 'matplotlib'"

**Solution**: Install Python dependencies
```bash
pip3 install matplotlib pandas numpy
```

### General Issues

**Problem**: "Command not found" errors

**Solution**: Ensure all prerequisites are installed:
```bash
git --version
docker --version
node --version
aws --version
python3 --version
```

**Problem**: Tests are failing

**Solution**: Install dependencies for each runtime:
```bash
cd lambdas/python && pip install -r requirements.txt -r requirements-dev.txt
cd lambdas/typescript && npm install
cd lambdas/go && go mod download
cd lambdas/kotlin && ./gradlew build
```

### Getting Help

- **Documentation**: Check `docs/` folder for detailed guides
- **Issues**: Open an issue on GitHub with logs and error messages
- **AWS Support**: For AWS-specific issues, check AWS documentation or AWS Support

## Conclusion

You now have a fully functional multi-runtime API benchmark running locally or on AWS! Experiment with different runtimes, run benchmarks, and analyze the results to make informed decisions about Lambda runtime selection for your projects.

Happy benchmarking! 🚀

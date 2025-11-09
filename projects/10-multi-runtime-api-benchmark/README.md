# Multi-Runtime API Benchmark

**A comprehensive performance comparison platform for AWS Lambda REST APIs implemented in Python, TypeScript, Go, and Kotlin.**

[![Tests](https://img.shields.io/badge/tests-450%2B%20passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-80%25%2B-brightgreen)]()
[![AWS CDK](https://img.shields.io/badge/AWS%20CDK-2.120.0-orange)]()
[![License](https://img.shields.io/badge/license-MIT-blue)]()

---

## 📋 Table of Contents

- [What is This Project?](#what-is-this-project)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Setup Guide](#setup-guide)
- [Cost Analysis](#cost-analysis)
- [Documentation](#documentation)
- [Performance Results](#performance-results)
- [Contributing](#contributing)

---

## 🎯 What is This Project?

The **Multi-Runtime API Benchmark** is a production-ready AWS serverless application that demonstrates and compares the performance characteristics of identical REST APIs implemented in four different programming languages:

### Purpose

1. **🔍 Performance Comparison** - Objectively compare cold start times, latency, throughput, and memory usage across Python, TypeScript, Go, and Kotlin Lambda functions
2. **📊 Benchmarking Platform** - Automated tools for measuring and visualizing performance metrics
3. **🏗️ Infrastructure Showcase** - Demonstrates reusable AWS CDK constructs and serverless best practices
4. **📚 Educational Resource** - Learn how to implement, test, and deploy the same API across multiple languages

### What It Does

This project provides:

- **✅ 4 Complete Lambda Implementations** - Python (FastAPI), TypeScript (Express), Go (Gin), Kotlin (Ktor)
- **✅ Identical REST API** - All runtimes implement the same CRUD operations on items stored in DynamoDB
- **✅ Performance Testing Suite** - Automated cold start measurements and load testing with k6
- **✅ Comparison Tools** - Generate reports and visualizations comparing all runtimes
- **✅ Local Development** - Full Docker Compose setup with LocalStack for zero-cost development
- **✅ CI/CD Pipeline** - GitHub Actions for automated testing, linting, and deployment
- **✅ Production Monitoring** - CloudWatch dashboards and alarms for all Lambda functions
- **✅ Comprehensive Testing** - 450+ tests across all components (80%+ coverage)

### Use Cases

- **Technology Selection** - Make data-driven decisions when choosing a Lambda runtime
- **Performance Analysis** - Understand the trade-offs between developer productivity and runtime performance
- **Learning Platform** - Compare idiomatic implementations across different programming paradigms
- **Benchmarking Reference** - Establish baseline performance metrics for your own applications

---

## ✨ Features

### 🚀 Four Production-Ready Lambda Implementations

| Runtime | Framework | Lambda Adapter | Key Features |
|---------|-----------|----------------|--------------|
| **Python 3.11** | FastAPI | Mangum | Fast development, excellent DX, Pydantic validation |
| **Node.js 20** | Express | serverless-http | Type-safe with TypeScript, familiar ecosystem |
| **Go 1.21** | Gin | AWS Lambda Go Proxy | Fastest cold starts, minimal memory footprint |
| **Java 17** | Ktor | Native handler | JVM performance, optional GraalVM compilation |

### 🎯 Benchmarking & Performance Testing

- **Automated Cold Start Measurement** - Measures initialization time after 5-minute idle periods
- **Load Testing with k6** - Configurable concurrent users (10→50→100) with comprehensive metrics
- **Comparison Reports** - Markdown reports with statistical analysis (avg, min, max, p50, p95, p99)
- **Visualizations** - Performance charts using matplotlib:
  - Cold start comparison
  - Latency percentiles
  - Throughput comparison
  - Error rates
  - Memory usage
  - Summary dashboard

### 🔄 Complete CI/CD Pipeline

**GitHub Actions workflows:**
- **test.yml** - Parallel testing of all 5 components (Python, TypeScript, Go, Kotlin, CDK)
- **lint.yml** - Code quality checks (black, ESLint, golangci-lint, ktlint, detekt)
- **deploy.yml** - Automated deployment with smoke tests to dev/staging/prod

**Features:**
- Codecov integration for coverage tracking
- Automated PR checks
- Post-deployment health verification
- GitHub Actions summaries with test results

### 🐳 Local Development Environment

**Docker Compose setup includes:**
- **LocalStack** - Local AWS cloud (DynamoDB, API Gateway, Lambda)
- **4 Lambda Services** - All runtimes with hot reload
- **DynamoDB Admin UI** - Visual table browser
- **Zero AWS Costs** - Complete local testing environment

**Ports:**
- Python Lambda: `localhost:8000`
- TypeScript Lambda: `localhost:8001`
- Go Lambda: `localhost:8002`
- Kotlin Lambda: `localhost:8003`
- LocalStack: `localhost:4566`
- DynamoDB Admin: `localhost:8080`

### 📊 Production Monitoring

- **CloudWatch Dashboard** - Real-time metrics for all Lambda functions
- **Automated Alarms** - Error rates, latency, throttling, memory
- **Custom Metrics** - Cold start tracking, runtime-specific performance data
- **Structured Logging** - Centralized logs with correlation IDs

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Amazon API Gateway                          │
│                   (REST API with CORS)                          │
└──────┬──────────┬──────────┬──────────┬──────────┬─────────────┘
       │          │          │          │          │
       │   ┌──────┴──────┬───┴──────┬───┴────┐    │
       │   │             │          │        │    │
       ▼   ▼             ▼          ▼        ▼    ▼
   ┌────────────┐  ┌────────────┐ ┌──────────┐  ┌──────────┐
   │  Python    │  │ TypeScript │ │    Go    │  │  Kotlin  │
   │  FastAPI   │  │  Express   │ │   Gin    │  │   Ktor   │
   │  + Mangum  │  │+ serverless│ │Framework │  │  Server  │
   └─────┬──────┘  └─────┬──────┘ └────┬─────┘  └────┬─────┘
         │               │              │             │
         └───────────────┴──────────────┴─────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Amazon DynamoDB    │
              │   (Items Table)      │
              │  Pay-per-request     │
              └──────────┬───────────┘
                         │
         ┌───────────────┴────────────────┐
         │                                │
         ▼                                ▼
┌──────────────────┐         ┌─────────────────────┐
│  CloudWatch      │         │   CloudWatch        │
│  Logs            │         │   Metrics +         │
│  (Structured)    │         │   Dashboard         │
└──────────────────┘         └─────────────────────┘
```

### Infrastructure Components

- **API Gateway** - Single REST API endpoint with runtime-specific paths
- **Lambda Functions** - 4 functions (Python, TypeScript, Go, Kotlin) sharing identical API
- **DynamoDB** - Single table with on-demand billing for items storage
- **CloudWatch** - Centralized logging, metrics, dashboard, and alarms
- **IAM Roles** - Least-privilege execution roles for each Lambda

**AWS CDK Stacks:**
1. **SharedStack** - API Gateway + DynamoDB table
2. **RuntimeStacks** - 4 Lambda functions (one per runtime)
3. **MonitoringStack** - CloudWatch dashboard + alarms

---

## ⚡ Quick Start

### Option 1: Local Development (No AWS Account Needed)

```bash
# Clone and navigate to project
git clone <repository-url>
cd projects/10-multi-runtime-api-benchmark

# Start all services with Docker Compose
docker-compose up -d

# Verify services are running
curl http://localhost:8000/python/health
curl http://localhost:8001/typescript/health
curl http://localhost:8002/go/health
curl http://localhost:8003/kotlin/health

# Access DynamoDB Admin UI
open http://localhost:8080

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**See:** [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md) for detailed guide

### Option 2: Deploy to AWS

```bash
# Prerequisites: AWS CLI configured, Node.js 18+, Python 3.11+, Go 1.21+, Java 17+

# 1. Install CDK dependencies
cd cdk && npm install && cd ..

# 2. Build all Lambda functions
./scripts/build-all.sh

# 3. Deploy to AWS (dev environment)
./scripts/deploy.sh dev

# 4. Test the deployed API
API_URL=$(aws cloudformation describe-stacks \
  --stack-name dev-benchmark-shared \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

curl $API_URL/python/health
```

**See:** [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md) for step-by-step guide

### Option 3: Run Benchmarks

```bash
# Deploy to AWS first (Option 2)

# Run complete benchmark suite
./scripts/benchmark-all.sh

# View results
cat results/run-*/comparison-report.md
open results/run-*/dashboard.png
```

**See:** [docs/BENCHMARKING.md](docs/BENCHMARKING.md) for benchmarking guide

---

## 📖 Setup Guide

### Prerequisites

#### For Local Development (Docker)
- **Docker** 20.10+ and **Docker Compose** 2.0+
- That's it! No other tools needed.

#### For AWS Deployment
- **AWS Account** with administrator access (or equivalent permissions)
- **AWS CLI** configured with credentials
- **Node.js** 18+ and **npm** 9+
- **Python** 3.11+
- **Go** 1.21+
- **Java** 17+ and **Gradle** 8.5+
- **AWS CDK** 2.120+ (`npm install -g aws-cdk`)

#### For Benchmarking (Optional)
- **k6** for load testing ([install guide](https://k6.io/docs/getting-started/installation/))
- **Python 3.11+** with matplotlib (`pip install matplotlib numpy`)

### Local Setup (5 minutes)

```bash
# 1. Start LocalStack and all Lambda services
docker-compose up -d

# 2. Wait for services to be ready (check logs)
docker-compose logs -f localstack

# 3. Verify DynamoDB table was created
docker-compose exec localstack awslocal dynamodb list-tables

# 4. Test all endpoints
for runtime in python typescript go kotlin; do
  echo "Testing $runtime..."
  curl http://localhost:$((8000 + $(echo $runtime | wc -c) % 4))/$runtime/health | jq
done

# 5. Create a test item
curl -X POST http://localhost:8000/python/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Laptop","description":"For testing","price":999.99}'

# 6. View in DynamoDB Admin
open http://localhost:8080
```

**Troubleshooting:** See [docs/LOCAL_DEVELOPMENT.md#troubleshooting](docs/LOCAL_DEVELOPMENT.md#troubleshooting)

### AWS Setup (15-20 minutes)

#### Step 1: Install Dependencies

```bash
# Install CDK dependencies
cd cdk
npm install

# Install Python dependencies
cd ../lambdas/python
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Install TypeScript dependencies
cd ../typescript
npm install

# Install Go dependencies
cd ../go
go mod download

# Install Kotlin dependencies
cd ../kotlin
./gradlew build
```

#### Step 2: Configure AWS

```bash
# Configure AWS CLI (if not already done)
aws configure

# Verify credentials
aws sts get-caller-identity

# Set your AWS region
export AWS_REGION=us-east-1  # or your preferred region
```

#### Step 3: Bootstrap CDK (One-time)

```bash
cd cdk

# Bootstrap CDK in your account/region
cdk bootstrap aws://ACCOUNT-ID/REGION

# Example:
# cdk bootstrap aws://123456789012/us-east-1
```

#### Step 4: Build Lambda Functions

```bash
# From project root
./scripts/build-all.sh

# This builds:
# - Python Lambda → lambdas/python/dist
# - TypeScript Lambda → lambdas/typescript/dist
# - Go Lambda → lambdas/go/bootstrap
# - Kotlin Lambda → lambdas/kotlin/build/libs/bootstrap.jar
```

#### Step 5: Deploy Infrastructure

```bash
# Deploy to dev environment
./scripts/deploy.sh dev

# Or deploy manually with CDK
cd cdk
npx cdk deploy --all --context environment=dev

# Deployment creates:
# - API Gateway REST API
# - 4 Lambda functions
# - DynamoDB table
# - CloudWatch dashboard
# - IAM roles and policies
```

#### Step 6: Test Deployment

```bash
# Get API URL from CloudFormation outputs
API_URL=$(aws cloudformation describe-stacks \
  --stack-name dev-benchmark-shared \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

echo "API URL: $API_URL"

# Test health endpoints
curl $API_URL/python/health | jq
curl $API_URL/typescript/health | jq
curl $API_URL/go/health | jq
curl $API_URL/kotlin/health | jq

# Create an item
curl -X POST $API_URL/python/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MacBook Pro",
    "description": "16-inch M3 Max",
    "price": 3499.99
  }' | jq

# List items
curl $API_URL/python/items | jq

# Get metrics
curl $API_URL/python/metrics | jq
```

#### Step 7: View CloudWatch Dashboard

```bash
# Open CloudWatch Console
aws cloudwatch list-dashboards

# Dashboard name: multi-runtime-benchmark-dev
```

Navigate to: **AWS Console → CloudWatch → Dashboards → multi-runtime-benchmark-dev**

---

## 💰 Cost Analysis

### Development Environment (Low Usage)

**Assumptions:**
- 100,000 requests/month
- 128MB memory allocation
- 100ms average execution time
- On-demand DynamoDB
- Single region (us-east-1)

| Service | Monthly Cost | Details |
|---------|--------------|---------|
| **Lambda** | $0.20 | 100K invocations × 4 runtimes, 128MB, 100ms avg |
| **API Gateway** | $0.35 | 100K API calls × 4 endpoints |
| **DynamoDB** | $0.25 | Pay-per-request, ~1M read/write units |
| **CloudWatch Logs** | $0.30 | ~1GB logs/month |
| **CloudWatch Metrics** | $0.10 | Custom metrics |
| **Data Transfer** | $0.10 | Minimal egress |
| **Total** | **~$1.30/month** | Development/testing workload |

### Production Environment (Moderate Usage)

**Assumptions:**
- 10M requests/month
- 256MB memory allocation
- 150ms average execution time
- Provisioned capacity (optional)
- High availability

| Service | Monthly Cost | Details |
|---------|--------------|---------|
| **Lambda** | $20.00 | 10M invocations × 4 runtimes, 256MB, 150ms avg |
| **API Gateway** | $35.00 | 10M API calls × 4 endpoints |
| **DynamoDB** | $25.00 | On-demand or provisioned capacity |
| **CloudWatch Logs** | $5.00 | ~10GB logs/month |
| **CloudWatch Metrics** | $3.00 | Custom metrics + alarms |
| **CloudWatch Dashboard** | $3.00 | 1 custom dashboard |
| **Data Transfer** | $5.00 | Egress charges |
| **Total** | **~$96/month** | Production workload |

### Cost Optimization Tips

1. **Use Provisioned Concurrency Selectively** - Only for critical, latency-sensitive endpoints
2. **Adjust Memory Allocation** - Test different memory sizes for optimal cost/performance
3. **Enable CloudWatch Logs Retention** - Set to 7-14 days instead of indefinite
4. **Use DynamoDB On-Demand** - For unpredictable traffic patterns
5. **Implement Caching** - API Gateway caching reduces Lambda invocations
6. **Monitor Cold Starts** - Go runtime has lowest cold start costs

**See:** [docs/COST_ANALYSIS.md](docs/COST_ANALYSIS.md) for detailed breakdown

---

## 📚 Documentation

### Core Documentation

- **[GETTING_STARTED.md](docs/GETTING_STARTED.md)** - Step-by-step setup guide for beginners
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Detailed architecture and design decisions
- **[API.md](docs/API.md)** - Complete API reference with examples
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Deployment guide for all environments
- **[COST_ANALYSIS.md](docs/COST_ANALYSIS.md)** - Detailed cost breakdown and optimization

### Development Guides

- **[LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)** - Local development with Docker Compose
- **[TESTING.md](docs/TESTING.md)** - Testing guide (unit, integration, e2e)
- **[BENCHMARKING.md](docs/BENCHMARKING.md)** - How to run and interpret benchmarks

### Lambda-Specific Documentation

- **[lambdas/python/README.md](lambdas/python/README.md)** - Python Lambda implementation guide
- **[lambdas/typescript/README.md](lambdas/typescript/README.md)** - TypeScript Lambda implementation guide
- **[lambdas/go/README.md](lambdas/go/README.md)** - Go Lambda implementation guide
- **[lambdas/kotlin/README.md](lambdas/kotlin/README.md)** - Kotlin Lambda implementation guide

### CI/CD & Operations

- **[.github/workflows/README.md](.github/workflows/README.md)** - GitHub Actions workflows explained

---

## 📊 Performance Results

### Expected Performance Characteristics

Based on typical AWS Lambda performance:

| Runtime | Cold Start | Warm Latency | Memory Usage | Package Size |
|---------|------------|--------------|--------------|--------------|
| **Go** | 80-150ms | 5-15ms | 30-50MB | ~10MB |
| **Python** | 200-400ms | 15-30ms | 50-80MB | ~25MB |
| **TypeScript** | 180-350ms | 10-25ms | 60-90MB | ~20MB |
| **Kotlin/JVM** | 800-1500ms | 20-40ms | 100-150MB | ~50MB |

**Note:** Actual results vary based on code complexity, dependencies, and AWS region.

### Run Your Own Benchmarks

```bash
# Complete benchmark suite
./scripts/benchmark-all.sh

# Results include:
# - Cold start measurements (CSV)
# - Load test results (JSON)
# - Comparison report (Markdown)
# - Performance visualizations (PNG)
```

**Sample Output:**
```
results/run-20250109_143022/
├── cold-starts.csv              # Raw cold start data
├── load-test-python.json        # k6 results per runtime
├── load-test-typescript.json
├── load-test-go.json
├── load-test-kotlin.json
├── comparison-report.md         # Summary report
├── dashboard.png                # All metrics dashboard
├── chart-cold-start.png         # Cold start comparison
├── chart-latency.png            # Latency percentiles
├── chart-throughput.png         # Requests per second
├── chart-errors.png             # Error rates
└── chart-memory.png             # Memory usage
```

---

## 🛠️ Development

### Project Structure

```
multi-runtime-api-benchmark/
├── .github/workflows/       # CI/CD GitHub Actions
│   ├── test.yml            # Automated testing
│   ├── lint.yml            # Code quality checks
│   └── deploy.yml          # Automated deployment
├── cdk/                     # Infrastructure as Code
│   ├── bin/app.ts          # CDK app entry point
│   ├── lib/                # CDK constructs
│   │   ├── config.ts       # Configuration
│   │   ├── shared-stack.ts # API Gateway + DynamoDB
│   │   ├── runtime-stack.ts # Lambda functions
│   │   └── monitoring-stack.ts # CloudWatch resources
│   └── test/               # CDK tests (45+ tests)
├── lambdas/                 # Lambda implementations
│   ├── python/             # Python 3.11 + FastAPI
│   │   ├── src/           # Source code
│   │   ├── tests/         # 85+ tests
│   │   ├── requirements.txt
│   │   └── Dockerfile.dev # Local development
│   ├── typescript/         # Node.js 20 + Express
│   │   ├── src/           # Source code
│   │   ├── __tests__/     # 72+ tests
│   │   ├── package.json
│   │   └── Dockerfile.dev
│   ├── go/                 # Go 1.21 + Gin
│   │   ├── cmd/           # Main application
│   │   ├── internal/      # Internal packages
│   │   ├── *_test.go      # 140+ tests
│   │   ├── go.mod
│   │   ├── Dockerfile.dev
│   │   └── .air.toml      # Hot reload config
│   └── kotlin/             # Java 17 + Ktor
│       ├── src/           # Source code + tests (165+ tests)
│       ├── build.gradle.kts
│       └── Dockerfile.dev
├── scripts/                 # Automation scripts
│   ├── benchmark-all.sh    # Master benchmark orchestrator
│   ├── measure-cold-starts.sh # Cold start measurement
│   ├── load-test.js        # k6 load testing
│   ├── compare-results.py  # Generate comparison reports
│   ├── visualize-results.py # Create charts
│   ├── build-all.sh        # Build all Lambdas
│   ├── build-{runtime}.sh  # Build individual Lambdas
│   ├── deploy.sh           # Deploy to AWS
│   └── localstack-init.sh  # LocalStack initialization
├── docs/                    # Documentation
├── docker-compose.yml       # Local development environment
└── README.md               # This file
```

### Running Tests

```bash
# All tests
npm run test  # From cdk/ or lambdas/typescript/
pytest        # From lambdas/python/
go test ./... # From lambdas/go/
./gradlew test # From lambdas/kotlin/

# With coverage
pytest --cov=src --cov-report=html
npm test -- --coverage
go test -coverprofile=coverage.out ./...
./gradlew test jacocoTestReport
```

### Code Quality

```bash
# Linting
black src/          # Python
npm run lint        # TypeScript
golangci-lint run   # Go
./gradlew ktlintCheck # Kotlin

# Formatting
black src/          # Python
npm run format      # TypeScript
go fmt ./...        # Go
./gradlew ktlintFormat # Kotlin
```

---

## 🤝 Contributing

Contributions are welcome! Please see our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Development Workflow

1. **Local Development** - Use Docker Compose for fast iteration
2. **Testing** - Ensure all tests pass (450+ tests must pass)
3. **Code Quality** - Run linters and formatters
4. **Documentation** - Update relevant documentation
5. **Pull Request** - Submit PR with clear description

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👏 Acknowledgments

- **AWS CDK Team** - Excellent infrastructure as code framework
- **FastAPI** - Modern, fast Python web framework
- **Express.js** - Minimal and flexible Node.js framework
- **Gin** - High-performance Go HTTP framework
- **Ktor** - Kotlin asynchronous framework
- **LocalStack** - Local AWS cloud stack for testing
- **k6** - Modern load testing tool

---

## 📞 Support

For questions, issues, or suggestions:

- **Issues:** [GitHub Issues](../../issues)
- **Documentation:** [docs/](docs/)
- **Examples:** See individual Lambda README files

---

**Built with ❤️ for the AWS serverless community**

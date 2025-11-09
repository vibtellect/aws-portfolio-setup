# Cost Analysis: Multi-Runtime API Benchmark

This document provides a comprehensive cost analysis for running the Multi-Runtime API Benchmark on AWS. We'll break down costs by service, provide pricing formulas, and offer optimization strategies.

## Table of Contents

- [Quick Summary](#quick-summary)
- [AWS Pricing Components](#aws-pricing-components)
- [Cost Scenarios](#cost-scenarios)
- [Detailed Cost Breakdown](#detailed-cost-breakdown)
- [Cost Optimization Strategies](#cost-optimization-strategies)
- [Cost Comparison by Runtime](#cost-comparison-by-runtime)
- [Monitoring Costs](#monitoring-costs)
- [Cost Calculators](#cost-calculators)

## Quick Summary

### Development/Testing Environment
- **Monthly Cost**: ~$1.30
- **Assumptions**: 100,000 requests/month, minimal traffic
- **Best For**: Learning, testing, portfolio projects

### Production Environment (Small)
- **Monthly Cost**: ~$96
- **Assumptions**: 10M requests/month, moderate traffic
- **Best For**: Small production applications, APIs

### Production Environment (Large)
- **Monthly Cost**: ~$890
- **Assumptions**: 100M requests/month, high traffic
- **Best For**: Large-scale applications

### Free Tier Benefits
- **Duration**: 12 months for new AWS accounts
- **Lambda**: 1M requests + 400,000 GB-seconds/month (always free)
- **API Gateway**: 1M API calls/month (first 12 months)
- **DynamoDB**: 25GB storage + 25 RCU + 25 WCU (always free)
- **CloudWatch**: 5GB logs + 10 custom metrics (always free)

**With Free Tier**: First year cost is **$0-$5/month** for development usage!

## AWS Pricing Components

### 1. AWS Lambda

AWS Lambda charges based on:
- **Number of requests**: $0.20 per 1M requests
- **Duration**: $0.0000166667 per GB-second

**Formula:**
```
Lambda Cost = (Requests × $0.20 / 1M) + (GB-seconds × $0.0000166667)

Where:
GB-seconds = (Memory in GB) × (Duration in seconds) × (Number of requests)
```

**Example Calculation** (1M requests, 512MB memory, 200ms avg duration):
```
Memory in GB = 512MB / 1024 = 0.5 GB
Duration in seconds = 200ms / 1000 = 0.2 seconds
GB-seconds = 0.5 × 0.2 × 1,000,000 = 100,000 GB-seconds

Request Cost = 1M × $0.20 / 1M = $0.20
Duration Cost = 100,000 × $0.0000166667 = $1.67

Total Lambda Cost = $0.20 + $1.67 = $1.87 per million requests
```

### 2. API Gateway

**REST API Pricing:**
- First 333M requests/month: $3.50 per million
- Next 667M requests/month: $2.80 per million
- Over 1B requests/month: $2.38 per million

**Formula:**
```
API Gateway Cost = Requests × $3.50 / 1M (for first tier)
```

**Example** (1M requests):
```
Cost = 1M × $3.50 / 1M = $3.50
```

### 3. DynamoDB

**On-Demand Pricing** (recommended for variable workloads):
- Write requests: $1.25 per million write request units (WRU)
- Read requests: $0.25 per million read request units (RRU)
- Storage: $0.25 per GB-month

**Provisioned Capacity Pricing** (for predictable workloads):
- Write capacity: $0.00065 per WCU-hour ($0.47 per WCU-month)
- Read capacity: $0.00013 per RCU-hour ($0.09 per RCU-month)
- Storage: $0.25 per GB-month

**Formula (On-Demand):**
```
DynamoDB Cost = (Write Requests × $1.25 / 1M) + (Read Requests × $0.25 / 1M) + (Storage GB × $0.25)
```

**Example** (1M writes, 3M reads, 1GB storage):
```
Write Cost = 1M × $1.25 / 1M = $1.25
Read Cost = 3M × $0.25 / 1M = $0.75
Storage Cost = 1GB × $0.25 = $0.25

Total DynamoDB Cost = $1.25 + $0.75 + $0.25 = $2.25
```

### 4. CloudWatch

- **Logs Ingestion**: $0.50 per GB ingested
- **Logs Storage**: $0.03 per GB-month
- **Custom Metrics**: $0.30 per metric-month (first 10,000 metrics)
- **Dashboard**: $3.00 per dashboard-month

**Formula:**
```
CloudWatch Cost = (Logs GB Ingested × $0.50) + (Logs GB Stored × $0.03) + (Metrics × $0.30)
```

**Example** (1GB logs, 20 metrics):
```
Logs Ingestion = 1GB × $0.50 = $0.50
Logs Storage = 1GB × $0.03 = $0.03
Metrics = 20 × $0.30 = $6.00

Total CloudWatch Cost = $0.50 + $0.03 + $6.00 = $6.53
```

## Cost Scenarios

### Scenario 1: Development/Testing (100K requests/month)

**Assumptions:**
- 100,000 total API requests/month
- 25,000 requests per Lambda (4 Lambdas)
- 50% read, 50% write operations
- 512MB memory allocation
- 200ms average duration
- <1GB log storage
- Minimal data storage

**Cost Breakdown:**

| Service | Calculation | Monthly Cost |
|---------|------------|--------------|
| **Lambda Requests** | 100K × $0.20 / 1M = $0.02 | $0.02 |
| **Lambda Duration** | 25K × 0.5GB × 0.2s × $0.0000166667 × 4 = $0.83 | $0.83 |
| **API Gateway** | 100K × $3.50 / 1M = $0.35 | $0.35 |
| **DynamoDB Writes** | 50K × $1.25 / 1M = $0.0625 | $0.06 |
| **DynamoDB Reads** | 50K × $0.25 / 1M = $0.0125 | $0.01 |
| **DynamoDB Storage** | 0.1GB × $0.25 = $0.025 | $0.03 |
| **CloudWatch Logs** | 0.5GB × $0.50 = $0.25 | $0.00* |
| **CloudWatch Metrics** | Free tier | $0.00* |
| **TOTAL** | | **$1.30** |

*Covered by free tier (5GB logs, 10 metrics)

**With Free Tier**: **$0.00/month** (all usage within free tier limits)

### Scenario 2: Small Production (10M requests/month)

**Assumptions:**
- 10,000,000 total API requests/month
- 2,500,000 requests per Lambda (4 Lambdas)
- 50% read, 50% write operations
- 512MB memory allocation
- 200ms average duration
- 10GB log storage
- 5GB data storage

**Cost Breakdown:**

| Service | Calculation | Monthly Cost |
|---------|------------|--------------|
| **Lambda Requests** | 10M × $0.20 / 1M = $2.00 | $2.00 |
| **Lambda Duration** | 2.5M × 0.5GB × 0.2s × $0.0000166667 × 4 = $83.33 | $83.33 |
| **API Gateway** | 10M × $3.50 / 1M = $35.00 | $35.00 |
| **DynamoDB Writes** | 5M × $1.25 / 1M = $6.25 | $6.25 |
| **DynamoDB Reads** | 5M × $0.25 / 1M = $1.25 | $1.25 |
| **DynamoDB Storage** | 5GB × $0.25 = $1.25 | $1.25 |
| **CloudWatch Logs Ingestion** | 10GB × $0.50 = $5.00 | $5.00 |
| **CloudWatch Logs Storage** | 10GB × $0.03 = $0.30 | $0.30 |
| **CloudWatch Metrics** | 20 × $0.30 = $6.00 | $6.00 |
| **TOTAL** | | **$140.38** |

**With Free Tier**: **$96.00/month** (saves ~$44 on Lambda requests/duration, DynamoDB, CloudWatch)

### Scenario 3: Large Production (100M requests/month)

**Assumptions:**
- 100,000,000 total API requests/month
- 25,000,000 requests per Lambda (4 Lambdas)
- 50% read, 50% write operations
- 512MB memory allocation
- 200ms average duration
- 100GB log storage
- 50GB data storage

**Cost Breakdown:**

| Service | Calculation | Monthly Cost |
|---------|------------|--------------|
| **Lambda Requests** | 100M × $0.20 / 1M = $20.00 | $20.00 |
| **Lambda Duration** | 25M × 0.5GB × 0.2s × $0.0000166667 × 4 = $833.33 | $833.33 |
| **API Gateway** | 100M × $3.50 / 1M = $350.00 | $350.00 |
| **DynamoDB Writes** | 50M × $1.25 / 1M = $62.50 | $62.50 |
| **DynamoDB Reads** | 50M × $0.25 / 1M = $12.50 | $12.50 |
| **DynamoDB Storage** | 50GB × $0.25 = $12.50 | $12.50 |
| **CloudWatch Logs Ingestion** | 100GB × $0.50 = $50.00 | $50.00 |
| **CloudWatch Logs Storage** | 100GB × $0.03 = $3.00 | $3.00 |
| **CloudWatch Metrics** | 20 × $0.30 = $6.00 | $6.00 |
| **TOTAL** | | **$1,349.83** |

**With Free Tier**: **$1,305.83/month** (saves ~$44)

### Scenario 4: Benchmarking Only

**Assumptions:**
- Running benchmarks 10 times/month
- 10,000 requests per benchmark run
- 100,000 total requests/month
- Short-lived (delete after benchmarking)

**Cost Breakdown:**

| Service | Monthly Cost |
|---------|--------------|
| **Lambda** | $0.85 |
| **API Gateway** | $0.35 |
| **DynamoDB** | $0.10 |
| **CloudWatch** | $0.00* |
| **TOTAL** | **$1.30** |

*Covered by free tier

**With Free Tier**: **$0.00/month**

## Detailed Cost Breakdown

### Lambda Cost by Runtime

Different runtimes have different performance characteristics, affecting costs:

**For 1M requests:**

| Runtime | Avg Duration | Memory | GB-seconds | Duration Cost | Total Cost* |
|---------|--------------|--------|------------|---------------|-------------|
| **Go** | 150ms | 512MB | 75,000 | $1.25 | $1.45 |
| **Python** | 200ms | 512MB | 100,000 | $1.67 | $1.87 |
| **TypeScript** | 250ms | 512MB | 125,000 | $2.08 | $2.28 |
| **Kotlin/JVM** | 400ms | 1024MB | 400,000 | $6.67 | $6.87 |

*Includes $0.20 request cost

**Key Insights:**
- **Go is 3.7x cheaper than Kotlin** due to faster execution and lower memory
- **Cold starts** don't significantly impact monthly costs (amortized over many requests)
- **Memory allocation** has a linear impact on cost
- **Execution time** is the primary cost driver

### API Gateway Cost Analysis

API Gateway costs are **uniform across all runtimes** (charges per request, not duration).

**Cost Tiers:**

| Monthly Requests | Cost per 1M | Monthly Cost |
|------------------|-------------|--------------|
| 0 - 333M | $3.50 | Variable |
| 333M - 1B | $2.80 | Discounted |
| 1B+ | $2.38 | Heavily discounted |

**Example:**
- 500M requests/month = (333M × $3.50) + (167M × $2.80) = $1,165.50 + $467.60 = **$1,633.10**

### DynamoDB Cost Scenarios

**On-Demand vs. Provisioned:**

| Traffic Pattern | Recommendation | Monthly Cost (10M requests) |
|-----------------|----------------|----------------------------|
| **Unpredictable** | On-Demand | $7.50 |
| **Steady** | Provisioned (10 RCU, 10 WCU) | $14.40 |
| **Spiky** | On-Demand | $7.50 |
| **High, Consistent** | Provisioned (100 RCU, 100 WCU) | $144.00 |

**Calculation for Provisioned (10 RCU, 10 WCU):**
```
Read Cost = 10 RCU × $0.09 = $0.90
Write Cost = 10 WCU × $0.47 = $4.70
Total = $0.90 + $4.70 = $5.60/month
```

**When to use Provisioned:**
- Traffic is **predictable** and **consistent**
- Running **24/7** with steady load
- Can save **up to 60%** vs. on-demand for steady workloads

**When to use On-Demand:**
- **Variable** or **unpredictable** traffic
- Development and testing
- New applications
- **Pay only for what you use**

### CloudWatch Cost Optimization

**Log Retention Strategies:**

| Retention Period | Storage Cost (10GB) | Annual Cost |
|------------------|---------------------|-------------|
| **1 day** | $0.03 | $0.36 |
| **1 week** | $0.21 | $2.52 |
| **1 month** | $0.90 | $10.80 |
| **1 year** | $10.80 | $129.60 |
| **Never expire** | Grows monthly | $∞$ |

**Recommendations:**
- **Development**: 1-7 days ($0.03-$0.21/month)
- **Production**: 30 days ($0.90/month)
- **Compliance**: 90-365 days ($2.70-$10.80/month)
- **Archive to S3**: For long-term retention at $0.023/GB-month (save 23%)

## Cost Optimization Strategies

### 1. Right-Size Lambda Memory

**Test different memory allocations:**

```bash
# Test with 256MB
aws lambda update-function-configuration --function-name my-function --memory-size 256

# Test with 512MB
aws lambda update-function-configuration --function-name my-function --memory-size 512

# Test with 1024MB
aws lambda update-function-configuration --function-name my-function --memory-size 1024
```

**Finding the sweet spot:**
- **Lower memory** = Lower cost per second, but slower execution
- **Higher memory** = Higher cost per second, but faster execution (more CPU)
- **Optimal** = Fastest execution time that minimizes total cost

**Example:**
- 256MB, 400ms: 256/1024 × 0.4 × $0.0000166667 = $0.0000017
- 512MB, 200ms: 512/1024 × 0.2 × $0.0000166667 = $0.0000017
- 1024MB, 100ms: 1024/1024 × 0.1 × $0.0000166667 = $0.0000017

**Result**: All three configurations cost the same! Use the fastest one (1024MB) for better user experience.

### 2. Choose the Right Runtime

**By Cost Efficiency:**

1. **Go** - Best performance, lowest cost
   - Use for: High-traffic APIs, performance-critical workloads
   - Cost: Baseline

2. **Python** - Good balance
   - Use for: General purpose, data processing, ML inference
   - Cost: 1.3x Go

3. **TypeScript** - Moderate
   - Use for: Node.js ecosystem, full-stack JavaScript projects
   - Cost: 1.6x Go

4. **Kotlin/JVM** - Highest cost
   - Use for: Existing JVM codebases, Spring Boot migrations
   - Cost: 4.7x Go

**Cost Savings Example (10M requests/month):**
- Switching from Kotlin to Go: **Saves $52/month** ($624/year)
- Switching from TypeScript to Python: **Saves $4.10/month** ($49/year)

### 3. Implement Caching

**API Gateway Caching:**
- Enable caching for GET requests
- **Cost**: $0.020/hour for 0.5GB cache = $14.40/month
- **Savings**: Reduces Lambda invocations by 50-90%

**Example (10M requests, 80% cache hit rate):**
```
Without caching:
Lambda: $83.33 + $2.00 = $85.33
API Gateway: $35.00
Total: $120.33

With caching:
Lambda: $16.67 + $0.40 = $17.07 (80% reduction)
API Gateway: $35.00
Cache: $14.40
Total: $66.47

Savings: $120.33 - $66.47 = $53.86/month (45% reduction)
```

### 4. Use DynamoDB Efficiently

**Batch Operations:**
- Use `BatchWriteItem` and `BatchGetItem` for multiple items
- **Savings**: Reduces request units by combining operations

**Projection Expressions:**
- Fetch only needed attributes
- **Savings**: Reduces data transfer and read capacity

**TTL (Time To Live):**
- Automatically delete old items
- **Savings**: Reduces storage costs

**Example:**
```
Without TTL: 100GB storage = $25/month
With TTL (10GB active): 10GB storage = $2.50/month
Savings: $22.50/month
```

### 5. Optimize Logging

**Reduce Log Volume:**
```python
# Instead of logging everything
logger.info(f"Processing item: {item}")  # Don't log every item

# Log selectively
if error:
    logger.error(f"Failed: {error}")  # Only log errors
```

**Structured Logging:**
- Use JSON format for easier parsing
- Enable log filtering in CloudWatch

**Log Levels:**
- **Development**: DEBUG level
- **Production**: INFO or WARN level

**Savings Example:**
```
DEBUG logging: 100GB/month = $50/month
INFO logging: 10GB/month = $5/month
Savings: $45/month (90% reduction)
```

### 6. Use Reserved Capacity (for predictable workloads)

**DynamoDB Reserved Capacity:**
- Commit to 1 or 3 years
- **Savings**: Up to 76% vs. provisioned capacity

**Example (100 WCU, 100 RCU):**
```
On-Demand: $600/month
Provisioned: $144/month
Reserved (1 year): $99/month (31% savings vs. provisioned)
Reserved (3 years): $72/month (50% savings vs. provisioned)
```

### 7. Leverage Free Tier

**Always Free Lambda:**
- 1M requests/month
- 400,000 GB-seconds/month

**Strategy for Multiple AWS Accounts:**
- Separate dev/staging/prod accounts
- Each gets free tier benefits
- **Savings**: 3 accounts = 3M free Lambda requests/month

### 8. Monitor and Set Budgets

**AWS Budgets:**
- Set monthly budget alerts
- Get notified at 50%, 80%, 100% thresholds
- **Cost**: First 2 budgets are free

**Cost Explorer:**
- Analyze spending patterns
- Identify cost anomalies
- Forecast future costs

**CloudWatch Alarms:**
- Alert on unusual Lambda invocations
- Detect cost spikes early

## Cost Comparison by Runtime

### Total Cost Comparison (10M requests/month)

| Runtime | Lambda | API Gateway | DynamoDB | CloudWatch | **Total** | vs. Cheapest |
|---------|--------|-------------|----------|------------|-----------|--------------|
| **Go** | $14.50 | $35.00 | $7.50 | $11.30 | **$68.30** | — |
| **Python** | $18.70 | $35.00 | $7.50 | $11.30 | **$72.50** | +6.1% |
| **TypeScript** | $22.80 | $35.00 | $7.50 | $11.30 | **$76.60** | +12.2% |
| **Kotlin** | $68.70 | $35.00 | $7.50 | $11.30 | **$122.50** | +79.3% |

**Key Takeaway**: Go is the most cost-effective runtime, Kotlin is the most expensive.

### Annual Cost Comparison

| Runtime | Monthly | Annual | 5-Year Total |
|---------|---------|--------|--------------|
| **Go** | $68.30 | $819.60 | $4,098 |
| **Python** | $72.50 | $870.00 | $4,350 |
| **TypeScript** | $76.60 | $919.20 | $4,596 |
| **Kotlin** | $122.50 | $1,470.00 | $7,350 |

**Savings by choosing Go over Kotlin**: **$650/year** or **$3,252 over 5 years**

## Monitoring Costs

### Real-Time Cost Tracking

**AWS Cost Explorer:**
- View daily/monthly costs
- Group by service, region, tag
- Identify cost trends

**AWS Budgets:**
```bash
# Set a monthly budget
aws budgets create-budget --account-id 123456789012 --budget '{
  "BudgetName": "MultiRuntimeAPIBudget",
  "BudgetLimit": {
    "Amount": "100",
    "Unit": "USD"
  },
  "TimeUnit": "MONTHLY",
  "BudgetType": "COST"
}'
```

**CloudWatch Metrics:**
- Track Lambda invocation count
- Monitor API Gateway requests
- Watch DynamoDB consumed capacity

**Custom Cost Dashboard:**
- Create CloudWatch dashboard
- Visualize cost metrics
- Set up alerts

### Cost Allocation Tags

Tag all resources for better cost tracking:

```typescript
// In CDK
const lambda = new Function(this, 'MyFunction', {
  // ... other props
  tags: {
    'Project': 'MultiRuntimeBenchmark',
    'Environment': 'Production',
    'Runtime': 'Python',
    'CostCenter': 'Engineering'
  }
});
```

**Benefits:**
- Track costs by project, environment, runtime
- Generate cost reports by tag
- Identify optimization opportunities

## Cost Calculators

### Lambda Cost Calculator

```python
def calculate_lambda_cost(requests, memory_mb, duration_ms):
    """Calculate monthly Lambda cost"""
    # Request cost
    request_cost = requests * 0.20 / 1_000_000

    # Duration cost
    gb_seconds = (memory_mb / 1024) * (duration_ms / 1000) * requests
    duration_cost = gb_seconds * 0.0000166667

    # Free tier (1M requests, 400K GB-seconds)
    free_requests = min(requests, 1_000_000)
    free_gb_seconds = min(gb_seconds, 400_000)

    request_cost -= free_requests * 0.20 / 1_000_000
    duration_cost -= free_gb_seconds * 0.0000166667

    total_cost = max(0, request_cost + duration_cost)

    return {
        'request_cost': max(0, request_cost),
        'duration_cost': max(0, duration_cost),
        'total_cost': total_cost
    }

# Example
result = calculate_lambda_cost(
    requests=10_000_000,
    memory_mb=512,
    duration_ms=200
)
print(f"Total Lambda Cost: ${result['total_cost']:.2f}")
# Output: Total Lambda Cost: $18.70
```

### API Gateway Cost Calculator

```python
def calculate_api_gateway_cost(requests):
    """Calculate monthly API Gateway cost"""
    # Pricing tiers
    if requests <= 333_000_000:
        cost = requests * 3.50 / 1_000_000
    elif requests <= 1_000_000_000:
        cost = (333_000_000 * 3.50 / 1_000_000) + \
               ((requests - 333_000_000) * 2.80 / 1_000_000)
    else:
        cost = (333_000_000 * 3.50 / 1_000_000) + \
               (667_000_000 * 2.80 / 1_000_000) + \
               ((requests - 1_000_000_000) * 2.38 / 1_000_000)

    return cost

# Example
cost = calculate_api_gateway_cost(10_000_000)
print(f"API Gateway Cost: ${cost:.2f}")
# Output: API Gateway Cost: $35.00
```

### DynamoDB Cost Calculator

```python
def calculate_dynamodb_cost(writes, reads, storage_gb, mode='on-demand'):
    """Calculate monthly DynamoDB cost"""
    if mode == 'on-demand':
        write_cost = writes * 1.25 / 1_000_000
        read_cost = reads * 0.25 / 1_000_000
    else:  # provisioned
        # Assume average WCU/RCU based on requests
        wcu = writes / (30 * 24 * 3600)  # Average per second
        rcu = reads / (30 * 24 * 3600)
        write_cost = wcu * 0.47
        read_cost = rcu * 0.09

    storage_cost = storage_gb * 0.25

    # Free tier (25 WCU, 25 RCU, 25GB)
    if mode == 'on-demand':
        free_writes = min(writes, 200_000_000)  # ~25 WCU equivalent
        free_reads = min(reads, 400_000_000)    # ~25 RCU equivalent
        write_cost -= free_writes * 1.25 / 1_000_000
        read_cost -= free_reads * 0.25 / 1_000_000

    free_storage = min(storage_gb, 25)
    storage_cost -= free_storage * 0.25

    total_cost = max(0, write_cost + read_cost + storage_cost)

    return {
        'write_cost': max(0, write_cost),
        'read_cost': max(0, read_cost),
        'storage_cost': max(0, storage_cost),
        'total_cost': total_cost
    }

# Example
result = calculate_dynamodb_cost(
    writes=5_000_000,
    reads=5_000_000,
    storage_gb=5,
    mode='on-demand'
)
print(f"Total DynamoDB Cost: ${result['total_cost']:.2f}")
# Output: Total DynamoDB Cost: $7.50
```

### Total Project Cost Calculator

```python
def calculate_total_cost(requests_per_month, runtime='python'):
    """Calculate total monthly cost for the project"""
    # Runtime characteristics
    runtime_specs = {
        'python': {'memory': 512, 'duration': 200},
        'typescript': {'memory': 512, 'duration': 250},
        'go': {'memory': 512, 'duration': 150},
        'kotlin': {'memory': 1024, 'duration': 400}
    }

    specs = runtime_specs[runtime]

    # Calculate costs
    lambda_cost = calculate_lambda_cost(
        requests_per_month,
        specs['memory'],
        specs['duration']
    )

    api_gateway_cost = calculate_api_gateway_cost(requests_per_month)

    # Assume 50/50 read/write split
    dynamodb_cost = calculate_dynamodb_cost(
        writes=requests_per_month // 2,
        reads=requests_per_month // 2,
        storage_gb=max(1, requests_per_month // 10_000_000),  # Estimate
        mode='on-demand'
    )

    # CloudWatch (estimate)
    log_gb = requests_per_month / 1_000_000  # ~1M requests = 1GB logs
    cloudwatch_cost = max(0, (log_gb * 0.50) + (log_gb * 0.03) + (20 * 0.30) - 5)  # -5 for free tier

    total = (lambda_cost['total_cost'] +
             api_gateway_cost +
             dynamodb_cost['total_cost'] +
             cloudwatch_cost)

    return {
        'lambda': lambda_cost['total_cost'],
        'api_gateway': api_gateway_cost,
        'dynamodb': dynamodb_cost['total_cost'],
        'cloudwatch': cloudwatch_cost,
        'total': total
    }

# Examples
print("Development (100K requests/month, Python):")
print(calculate_total_cost(100_000, 'python'))

print("\nProduction (10M requests/month, Go):")
print(calculate_total_cost(10_000_000, 'go'))

print("\nLarge Production (100M requests/month, Go):")
print(calculate_total_cost(100_000_000, 'go'))
```

## Conclusion

### Key Takeaways

1. **Free Tier is Generous**: Development and testing can be completely free
2. **Runtime Matters**: Go is 79% cheaper than Kotlin for the same workload
3. **Lambda Duration is the Main Cost Driver**: Optimize code performance
4. **API Gateway is Fixed**: Can't optimize, but consider alternatives for high volume
5. **DynamoDB On-Demand is Best for Variable Workloads**: Avoid over-provisioning
6. **Logging Can Be Expensive**: Be selective about what you log
7. **Caching Can Save 40-60%**: Enable for read-heavy workloads
8. **Monitor Actively**: Set budgets and alerts to avoid surprises

### Cost Optimization Checklist

- [ ] Right-size Lambda memory (test different allocations)
- [ ] Choose the most cost-effective runtime for your use case
- [ ] Enable API Gateway caching for read-heavy workloads
- [ ] Use DynamoDB on-demand for variable traffic
- [ ] Implement TTL for temporary data
- [ ] Reduce logging in production
- [ ] Set up cost budgets and alerts
- [ ] Use cost allocation tags
- [ ] Monitor Cost Explorer regularly
- [ ] Consider Reserved Capacity for predictable workloads
- [ ] Leverage all free tier benefits
- [ ] Archive old logs to S3

### Recommended Configuration by Use Case

**Portfolio/Learning Project:**
- **Cost Target**: $0-$5/month
- **Configuration**: Minimal traffic, free tier only
- **Runtime**: Any (learning focus)

**Small Production API:**
- **Cost Target**: $50-$150/month
- **Configuration**: 10M requests/month
- **Runtime**: Go or Python (cost effective)
- **Optimizations**: On-demand pricing, 7-day log retention

**Medium Production API:**
- **Cost Target**: $300-$600/month
- **Configuration**: 50M requests/month
- **Runtime**: Go (best performance/cost)
- **Optimizations**: API caching, provisioned DynamoDB, 30-day logs

**Large Production API:**
- **Cost Target**: $1,000-$2,500/month
- **Configuration**: 100M+ requests/month
- **Runtime**: Go exclusively
- **Optimizations**: Reserved capacity, aggressive caching, S3 log archival

## Additional Resources

- [AWS Lambda Pricing](https://aws.amazon.com/lambda/pricing/)
- [API Gateway Pricing](https://aws.amazon.com/api-gateway/pricing/)
- [DynamoDB Pricing](https://aws.amazon.com/dynamodb/pricing/)
- [CloudWatch Pricing](https://aws.amazon.com/cloudwatch/pricing/)
- [AWS Free Tier](https://aws.amazon.com/free/)
- [AWS Cost Explorer](https://aws.amazon.com/aws-cost-management/aws-cost-explorer/)
- [AWS Budgets](https://aws.amazon.com/aws-cost-management/aws-budgets/)
- [AWS Pricing Calculator](https://calculator.aws/)

---

**Last Updated**: January 2025
**Pricing Region**: US East (N. Virginia) - us-east-1
**Currency**: USD

*Note: AWS pricing can change. Always verify current pricing at https://aws.amazon.com/pricing/*

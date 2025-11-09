# Testing Guide

## Overview

Das Multi-Runtime API Benchmark Projekt implementiert umfassende Tests für alle Komponenten:
- **CDK Stack Tests**: Infrastructure as Code Tests
- **Python Lambda Tests**: Unit Tests für FastAPI Implementation
- **TypeScript Lambda Tests**: Unit Tests für Express Implementation
- **Coverage Target**: Minimum 80% für alle Komponenten

## Test-Stack

### CDK Tests (TypeScript)
- **Framework**: Jest
- **Assertion Library**: AWS CDK Assertions
- **Coverage Tool**: Jest Coverage

### Python Lambda Tests
- **Framework**: pytest
- **Mocking**: moto (AWS Services), pytest-mock
- **HTTP Testing**: FastAPI TestClient
- **Coverage Tool**: pytest-cov

### TypeScript Lambda Tests
- **Framework**: Jest
- **Mocking**: aws-sdk-client-mock
- **Type Safety**: Full TypeScript types
- **Coverage Tool**: Jest Coverage

## Running Tests

### CDK Tests

```bash
cd projects/10-multi-runtime-api-benchmark/cdk

# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Expected Output:**
```
PASS test/shared-stack.test.ts
PASS test/runtime-stack.test.ts
PASS test/monitoring-stack.test.ts

Test Suites: 3 passed, 3 total
Tests:       45 passed, 45 total
Coverage:    > 80%
```

### Python Lambda Tests

```bash
cd projects/10-multi-runtime-api-benchmark/lambdas/python

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run all tests
pytest

# Run with coverage
pytest --cov=src --cov-report=html

# Run specific test file
pytest tests/unit/test_models.py

# Run with verbose output
pytest -v

# Run only fast tests (exclude slow integration tests)
pytest -m "not slow"
```

**Expected Output:**
```
================================== test session starts ==================================
collected 85 items

tests/unit/test_models.py ..................                                     [ 21%]
tests/unit/test_dynamodb.py .............................                       [ 55%]
tests/unit/test_metrics.py ...................                                  [ 77%]
tests/unit/test_app.py .......................                                  [100%]

---------- coverage: platform linux, python 3.11.6 -----------
Name                           Stmts   Miss  Cover
--------------------------------------------------
src/__init__.py                    1      0   100%
src/app.py                       120      8    93%
src/models/__init__.py             1      0   100%
src/models/item.py                32      1    97%
src/utils/__init__.py              1      0   100%
src/utils/dynamodb.py            102      6    94%
src/utils/metrics.py              45      3    93%
--------------------------------------------------
TOTAL                            302     18    94%

================================== 85 passed in 2.45s ===================================
```

### TypeScript Lambda Tests

```bash
cd projects/10-multi-runtime-api-benchmark/lambdas/typescript

# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch

# Run specific test file
npm test -- src/__tests__/models.test.ts
```

**Expected Output:**
```
PASS src/__tests__/models.test.ts
PASS src/__tests__/dynamodb.test.ts
PASS src/__tests__/metrics.test.ts
PASS src/__tests__/index.test.ts

Test Suites: 4 passed, 4 total
Tests:       72 passed, 72 total
Snapshots:   0 total
Time:        3.482 s

----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |   92.15 |    88.23 |   95.12 |   91.89 |
----------|---------|----------|---------|---------|-------------------
```

## Test Structure

### CDK Test Structure

```
cdk/test/
├── shared-stack.test.ts         # DynamoDB + API Gateway Tests
├── runtime-stack.test.ts        # Lambda Stack Tests
└── monitoring-stack.test.ts     # CloudWatch Dashboard Tests
```

**Test Categories:**
- Resource creation validation
- Property verification
- Tag validation
- CloudFormation output verification
- Resource count checks

### Python Test Structure

```
lambdas/python/tests/
├── __init__.py
├── unit/
│   ├── __init__.py
│   ├── test_models.py          # Pydantic model tests
│   ├── test_dynamodb.py        # DynamoDB client tests
│   ├── test_metrics.py         # Metrics collector tests
│   └── test_app.py             # FastAPI endpoint tests
└── integration/                 # Integration tests (future)
    └── __init__.py
```

**Test Categories:**
- **Models**: Validation, serialization, edge cases
- **DynamoDB**: CRUD operations, error handling
- **Metrics**: Collection, cold start detection
- **API**: All endpoints, error responses, CORS

### TypeScript Test Structure

```
lambdas/typescript/src/__tests__/
├── models.test.ts              # TypeScript model tests
├── dynamodb.test.ts            # DynamoDB service tests
├── metrics.test.ts             # Metrics collector tests
└── index.test.ts               # Express app + handler tests
```

**Test Categories:**
- **Models**: Type safety, interfaces
- **DynamoDB**: CRUD with mocked AWS SDK
- **Metrics**: Memory tracking, Lambda context
- **Handler**: API Gateway event handling

## Test Patterns

### Mocking DynamoDB (Python)

```python
from moto import mock_dynamodb
import boto3

@mock_dynamodb
def test_create_item():
    # Create real mock DynamoDB table
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.create_table(
        TableName='test-table',
        KeySchema=[{'AttributeName': 'id', 'KeyType': 'HASH'}],
        AttributeDefinitions=[{'AttributeName': 'id', 'AttributeType': 'S'}],
        BillingMode='PAY_PER_REQUEST'
    )

    # Test code here
    client = DynamoDBClient()
    result = client.create_item(item_data)

    assert result.id is not None
```

### Mocking DynamoDB (TypeScript)

```typescript
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoMock = mockClient(DynamoDBClient);

test('creates item successfully', async () => {
  dynamoMock.on(PutItemCommand).resolves({});

  const service = new DynamoDBService();
  const result = await service.createItem(itemData);

  expect(result.id).toBeDefined();
});
```

### Testing FastAPI Endpoints

```python
from fastapi.testclient import TestClient
from src.app import app

def test_health_check():
    client = TestClient(app)
    response = client.get("/health")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
```

### Testing CDK Stacks

```typescript
import { Template } from 'aws-cdk-lib/assertions';

test('creates DynamoDB table', () => {
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'dev-benchmark-items',
    BillingMode: 'PAY_PER_REQUEST'
  });
});
```

## Coverage Reports

### Viewing Coverage Reports

**Python:**
```bash
cd lambdas/python
pytest --cov=src --cov-report=html
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

**TypeScript:**
```bash
cd lambdas/typescript
npm run test:coverage
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
```

**CDK:**
```bash
cd cdk
npm run test:coverage
open coverage/lcov-report/index.html
```

### Coverage Thresholds

Alle Projekte haben 80% Coverage-Threshold:

```
Branches: 80%
Functions: 80%
Lines: 80%
Statements: 80%
```

Tests schlagen fehl, wenn Coverage unter 80% fällt.

## CI/CD Integration

### GitHub Actions (Beispiel)

```yaml
name: Test Multi-Runtime Benchmark

on:
  push:
    paths:
      - 'projects/10-multi-runtime-api-benchmark/**'
  pull_request:
    paths:
      - 'projects/10-multi-runtime-api-benchmark/**'

jobs:
  test-cdk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Test CDK
        run: |
          cd projects/10-multi-runtime-api-benchmark/cdk
          npm install
          npm test

  test-python:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Test Python Lambda
        run: |
          cd projects/10-multi-runtime-api-benchmark/lambdas/python
          pip install -r requirements.txt
          pytest --cov=src --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  test-typescript:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - name: Test TypeScript Lambda
        run: |
          cd projects/10-multi-runtime-api-benchmark/lambdas/typescript
          npm install
          npm run test:coverage
```

## Debugging Tests

### Python Debugging

```bash
# Run with debugging output
pytest -v -s

# Run single test with debugging
pytest tests/unit/test_app.py::TestHealthEndpoint::test_health_check -v -s

# Drop into debugger on failure
pytest --pdb

# Use print statements (will show with -s flag)
def test_something():
    print(f"Debug: value = {value}")
    assert value == expected
```

### TypeScript Debugging

```bash
# Run with verbose output
npm test -- --verbose

# Run single test file
npm test -- src/__tests__/models.test.ts

# Debug in VS Code:
# Add breakpoint, then use Jest Debug configuration
```

## Common Issues

### Python: Import Errors

**Problem**: `ModuleNotFoundError: No module named 'src'`

**Solution**:
```bash
# Make sure you're in the correct directory
cd lambdas/python

# Activate virtual environment
source venv/bin/activate

# Install in editable mode
pip install -e .
```

### TypeScript: Type Errors

**Problem**: TypeScript compilation errors in tests

**Solution**:
```bash
# Make sure all type definitions are installed
npm install --save-dev @types/aws-lambda @types/jest

# Clear Jest cache
npm test -- --clearCache
```

### CDK: Snapshot Mismatches

**Problem**: CDK tests fail due to changed resources

**Solution**:
```bash
# Update snapshots if changes are intentional
npm test -- -u

# Or delete snapshots and regenerate
rm -rf test/__snapshots__
npm test
```

### Moto: DynamoDB Not Available

**Problem**: `ImportError: cannot import name 'mock_dynamodb'`

**Solution**:
```bash
# Install moto with dynamodb extra
pip install 'moto[dynamodb]'

# Or reinstall all dependencies
pip install -r requirements.txt
```

## Best Practices

### 1. Test Naming
```python
# Good
def test_create_item_with_valid_data():
    pass

def test_create_item_missing_required_fields():
    pass

# Bad
def test_create():
    pass

def test1():
    pass
```

### 2. Test Organization
- One test file per source file
- Group related tests in classes
- Use descriptive test names
- Test happy path and edge cases

### 3. Mocking
- Mock external dependencies (AWS, databases)
- Don't mock the system under test
- Use realistic mock data
- Clean up mocks in teardown

### 4. Assertions
```python
# Good - specific assertions
assert item.name == "Expected Name"
assert len(items) == 3

# Bad - vague assertions
assert item
assert items
```

### 5. Test Independence
- Each test should be independent
- Use fixtures/beforeEach for setup
- Clean up after each test
- Don't rely on test execution order

## Performance Testing

Für Performance-Tests siehe separate Dokumentation:
- Load Testing mit k6
- Stress Testing
- Cold Start Measurements
- Latency Benchmarks

## Future Improvements

- [ ] Integration tests mit echtem AWS Stack
- [ ] End-to-End tests
- [ ] Performance regression tests
- [ ] Contract tests zwischen Services
- [ ] Mutation testing
- [ ] Visual regression tests für Dashboard

## Resources

- [Jest Documentation](https://jestjs.io/)
- [pytest Documentation](https://docs.pytest.org/)
- [AWS CDK Testing](https://docs.aws.amazon.com/cdk/v2/guide/testing.html)
- [moto Documentation](http://docs.getmoto.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

## Support

Bei Problemen mit Tests:
1. Prüfe Test-Logs und Fehler messages
2. Verifiziere Dependencies (package.json, requirements.txt)
3. Überprüfe Mock-Konfiguration
4. Konsultiere diese Dokumentation
5. Erstelle GitHub Issue mit Details

# Architektur-Dokumentation

## Überblick

Multi-Runtime API Benchmark ist eine Serverless-Anwendung auf AWS, die identische REST API Funktionalität in verschiedenen Programmiersprachen implementiert, um objektive Performance-Vergleiche zu ermöglichen.

## Architektur-Diagramm

```
┌─────────────────────────────────────────────────────────────────────┐
│                            Internet                                  │
└─────────────────────────┬───────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      AWS API Gateway                                 │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ REST API: multi-runtime-benchmark-api-{env}                 │   │
│  │                                                              │   │
│  │ Routes:                                                      │   │
│  │  - /python/*     → Python Lambda Integration                │   │
│  │  - /typescript/* → TypeScript Lambda Integration            │   │
│  │  - /go/*         → Go Lambda Integration (planned)          │   │
│  │  - /kotlin/*     → Kotlin Lambda Integration (planned)      │   │
│  │                                                              │   │
│  │ Features:                                                    │   │
│  │  - CloudWatch Logging enabled                               │   │
│  │  - X-Ray Tracing enabled                                    │   │
│  │  - CORS configured                                           │   │
│  │  - Metrics enabled                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
└────┬──────────────┬──────────────┬──────────────┬─────────────────┘
     │              │              │              │
     ▼              ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Python   │  │TypeScript│  │   Go     │  │  Kotlin  │
│ Lambda   │  │ Lambda   │  │ Lambda   │  │ Lambda   │
├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤
│Runtime:  │  │Runtime:  │  │Runtime:  │  │Runtime:  │
│Python    │  │Node.js   │  │PROVIDED  │  │PROVIDED  │
│3.11      │  │20.x      │  │AL2       │  │AL2       │
├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤
│Framework:│  │Framework:│  │Framework:│  │Framework:│
│FastAPI + │  │Express + │  │Gin       │  │Ktor +    │
│Mangum    │  │serverless│  │          │  │GraalVM   │
│          │  │-http     │  │          │  │Native    │
├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤
│Memory:   │  │Memory:   │  │Memory:   │  │Memory:   │
│512MB     │  │512MB     │  │512MB     │  │512MB     │
├──────────┤  ├──────────┤  ├──────────┤  ├──────────┤
│Timeout:  │  │Timeout:  │  │Timeout:  │  │Timeout:  │
│30s       │  │30s       │  │30s       │  │30s       │
└────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
     │            │            │            │
     │            │            │            │
     └────────────┴────────────┴────────────┘
                      │
                      ▼
     ┌─────────────────────────────────────┐
     │         DynamoDB Table              │
     │  ┌───────────────────────────────┐  │
     │  │ Table: {env}-benchmark-items  │  │
     │  │                               │  │
     │  │ Partition Key: id (String)    │  │
     │  │                               │  │
     │  │ Attributes:                   │  │
     │  │  - name: String               │  │
     │  │  - description: String        │  │
     │  │  - price: Number              │  │
     │  │  - created_at: Number         │  │
     │  │  - updated_at: Number         │  │
     │  │                               │  │
     │  │ Billing: PAY_PER_REQUEST      │  │
     │  │ Stream: NEW_AND_OLD_IMAGES    │  │
     │  │ PITR: Enabled (prod only)     │  │
     │  └───────────────────────────────┘  │
     └─────────────────────────────────────┘
                      │
                      ▼
     ┌─────────────────────────────────────┐
     │      CloudWatch Monitoring          │
     │  ┌───────────────────────────────┐  │
     │  │ Dashboard:                    │  │
     │  │  - Cold Start Metrics         │  │
     │  │  - Duration Metrics (P50-P99) │  │
     │  │  - Memory Utilization         │  │
     │  │  - Error Rates                │  │
     │  │  - Invocation Counts          │  │
     │  │  - DynamoDB Metrics           │  │
     │  └───────────────────────────────┘  │
     │                                     │
     │  ┌───────────────────────────────┐  │
     │  │ Alarms:                       │  │
     │  │  - High Error Rate (>1%)      │  │
     │  │  - High Latency (P99 >1000ms) │  │
     │  │  - Throttling Events          │  │
     │  │  - Memory Warnings            │  │
     │  └───────────────────────────────┘  │
     │                                     │
     │  ┌───────────────────────────────┐  │
     │  │ Log Groups:                   │  │
     │  │  - /aws/lambda/{function}     │  │
     │  │  - Retention: 7-14 days       │  │
     │  └───────────────────────────────┘  │
     └─────────────────────────────────────┘
                      │
                      ▼
     ┌─────────────────────────────────────┐
     │      SNS Topic (Optional)           │
     │  - Alarm notifications              │
     │  - Email subscriptions              │
     └─────────────────────────────────────┘
```

## Komponenten-Details

### 1. API Gateway

**Typ**: REST API

**Konfiguration**:
- Stage: dev/staging/prod
- Logging: Full request/response logging
- Tracing: AWS X-Ray enabled
- Metrics: Detailed CloudWatch metrics
- CORS: Enabled für alle Origins

**Routing**:
```
/{runtime}/health     → Runtime Health Check
/{runtime}/items      → Items List/Create
/{runtime}/items/{id} → Item Get/Update/Delete
/{runtime}/metrics    → Runtime Metrics
```

**Throttling**:
- Standard API Gateway Limits
- Burst: 10.000 req/sec
- Steady: 5.000 req/sec

### 2. Lambda Functions

#### Python Lambda
- **Runtime**: python3.11
- **Handler**: `app.handler`
- **Framework**: FastAPI 0.104.x
- **Adapter**: Mangum 0.17.x
- **SDK**: boto3 (AWS SDK for Python)
- **Features**:
  - Async/await support
  - Pydantic validation
  - AWS Lambda Powertools
  - Structured logging

#### TypeScript Lambda
- **Runtime**: nodejs20.x
- **Handler**: `index.handler`
- **Framework**: Express 4.18.x
- **Adapter**: serverless-http 3.2.x
- **SDK**: @aws-sdk/client-dynamodb v3
- **Features**:
  - Full TypeScript strict mode
  - ES2020 target
  - esbuild bundling
  - Tree-shaking

#### Go Lambda (Geplant)
- **Runtime**: provided.al2
- **Framework**: Gin
- **Build**: Cross-compilation für Linux ARM64
- **Features**:
  - Native binary performance
  - Minimal cold starts
  - Low memory footprint

#### Kotlin Lambda (Geplant)
- **Runtime**: provided.al2
- **Framework**: Ktor
- **Build**: GraalVM Native Image
- **Features**:
  - AOT compilation
  - Sub-second cold starts
  - Reduced memory usage

### 3. DynamoDB

**Tabellen-Konfiguration**:
```typescript
{
  tableName: "{env}-benchmark-items",
  partitionKey: { name: "id", type: STRING },
  billingMode: PAY_PER_REQUEST,
  stream: NEW_AND_OLD_IMAGES,
  pointInTimeRecovery: true (prod only),
  encryption: AWS_MANAGED
}
```

**Zugriffsmuster**:
- Get Item: O(1) - Direct partition key lookup
- Put Item: O(1) - Direct write
- Update Item: O(1) - Direct update
- Delete Item: O(1) - Direct delete
- Scan: O(n) - Full table scan (paginated)

### 4. IAM Rollen

#### Lambda Execution Role
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/{env}-benchmark-items",
        "arn:aws:dynamodb:*:*:table/{env}-benchmark-items/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "xray:PutTraceSegments",
        "xray:PutTelemetryRecords"
      ],
      "Resource": "*"
    }
  ]
}
```

### 5. CloudWatch Monitoring

#### Dashboards
- **Cold Start Duration**: Init duration metrics
- **Request Duration**: P50, P95, P99 latencies
- **Memory Utilization**: Heap usage, RSS
- **Error Rates**: Errors per runtime
- **Invocation Counts**: Request volume
- **DynamoDB Metrics**: Read/Write capacity, latency

#### Log Groups
- Retention: 7 days (dev), 14 days (prod)
- Format: JSON structured logs
- Encryption: AWS managed keys

#### Alarms
- Error rate threshold: 1% (5 min window)
- Latency threshold: P99 > 1000ms (5 min window)
- Throttle threshold: Any throttling events
- Memory threshold: >90% utilization

## CDK Stack-Architektur

### Stack Organization

```
App
├── SharedStack
│   ├── DynamoDB Table
│   └── API Gateway
├── PythonStack
│   ├── Lambda Function
│   ├── IAM Role
│   └── Log Group
├── TypeScriptStack
│   ├── Lambda Function
│   ├── IAM Role
│   └── Log Group
├── GoStack (planned)
│   ├── Lambda Function
│   ├── IAM Role
│   └── Log Group
├── KotlinStack (planned)
│   ├── Lambda Function
│   ├── IAM Role
│   └── Log Group
└── MonitoringStack
    ├── CloudWatch Dashboard
    ├── Alarms
    └── SNS Topic (optional)
```

### Stack Dependencies

```
MonitoringStack
  ↑ depends on
  ├── PythonStack
  │     ↑ depends on
  │     └── SharedStack
  ├── TypeScriptStack
  │     ↑ depends on
  │     └── SharedStack
  ├── GoStack (planned)
  │     ↑ depends on
  │     └── SharedStack
  └── KotlinStack (planned)
        ↑ depends on
        └── SharedStack
```

## Datenfluss

### Request Flow
```
1. Client Request
   ↓
2. API Gateway (validate, log, route)
   ↓
3. Lambda Invocation (cold/warm start)
   ↓
4. Request Processing (parse, validate)
   ↓
5. DynamoDB Operation (read/write)
   ↓
6. Response Generation (format, log)
   ↓
7. API Gateway Response
   ↓
8. Client Response
```

### Metrics Collection Flow
```
1. Lambda Execution
   ↓
2. CloudWatch Logs (structured logs)
   ↓
3. CloudWatch Metrics (auto-generated)
   ↓
4. Custom Metrics (via Embedded Metric Format)
   ↓
5. CloudWatch Dashboard (visualization)
   ↓
6. Alarms (threshold evaluation)
   ↓
7. SNS Notifications (if alarm triggered)
```

## Sicherheitsarchitektur

### Netzwerk-Sicherheit
- API Gateway: Public endpoint mit HTTPS
- Lambda: Keine VPC (optimiert für Cold Start)
- DynamoDB: AWS managed, encrypted at rest

### Datenschutz
- Encryption at rest: AWS managed keys
- Encryption in transit: TLS 1.2+
- No sensitive data in logs

### Zugriffskontrolle
- IAM Roles: Least privilege principle
- API Gateway: Open (für Benchmark-Zwecke)
- DynamoDB: IAM-based access only

## Performance-Optimierungen

### Lambda Optimierungen
- **Python**:
  - FastAPI: Async/await für I/O
  - Mangum: Effiziente ASGI-zu-Lambda Bridge
  - Powertools: Optimierte Logging/Metriken

- **TypeScript**:
  - esbuild: Schnelles Bundling
  - Tree-shaking: Minimale Bundle-Größe
  - AWS SDK v3: Modulare Imports

### Cold Start Minimierung
- Minimale Dependencies
- Code-Splitting
- Lazy Loading
- Connection Pooling (DynamoDB)

### Caching-Strategie
- DynamoDB: Keine zusätzlichen Caches
- API Gateway: Caching optional (nicht aktiviert)
- Lambda: Globale Variablen für Connections

## Skalierung

### Horizontal Scaling
- Lambda: Automatisches Scaling (1-1000 concurrent)
- DynamoDB: Pay-per-Request (auto-scaling)
- API Gateway: Managed scaling

### Limits
- Lambda concurrent executions: 1000 (default)
- DynamoDB: Keine Limits (Pay-per-Request)
- API Gateway: 10.000 req/s burst

## Kosten-Optimierung

### Lambda
- Memory: 512MB (optimiert für Balance)
- Timeout: 30s (vermeidet unnötige Kosten)
- Architecture: x86_64 (günstiger als arm64)

### DynamoDB
- Billing: Pay-per-Request (keine Reserved Capacity)
- Streams: Nur wenn benötigt
- PITR: Nur in Production

### CloudWatch
- Logs: Kurze Retention (7-14 Tage)
- Metrics: Standard metrics (keine Custom High-Res)
- Dashboards: Konsolidiert (1 Dashboard)

## Disaster Recovery

### Backup-Strategie
- DynamoDB: Point-in-Time Recovery (prod)
- Lambda: Code in Git + CDK
- Configuration: Infrastructure as Code

### Recovery Ziele
- RTO: < 1 Stunde (neues Deployment)
- RPO: < 1 Minute (DynamoDB PITR)

## Überwachung & Alarmierung

### Metriken
- Funktionale: Error rate, latency, throughput
- Technische: Cold starts, memory, duration
- Business: API calls per runtime, cost per runtime

### Logs
- Strukturiert: JSON format
- Korrelation: Request ID tracking
- Retention: Kosten-optimiert

### Alarms
- Kritisch: Error rate, throttling
- Warnung: High latency, memory warnings
- Info: Deployment events

## Zukunfts-Erweiterungen

### Geplante Features
- [ ] API Key Authentifizierung
- [ ] Rate Limiting
- [ ] Caching Layer (ElastiCache)
- [ ] Multi-Region Deployment
- [ ] Blue/Green Deployments
- [ ] A/B Testing
- [ ] Custom Domains
- [ ] WAF Integration

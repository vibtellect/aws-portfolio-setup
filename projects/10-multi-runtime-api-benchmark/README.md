# Multi-Runtime API Benchmark

Eine vergleichende Performance-Analyse-Plattform für AWS Lambda-basierte REST APIs, implementiert in vier verschiedenen Programmiersprachen.

## Projektziel

Entwicklung einer objektiven Performance-Vergleichsplattform für AWS Lambda REST APIs in Python, TypeScript, Go und Kotlin. Das System demonstriert die Wiederverwendbarkeit der hauseigenen AWS CDK Constructs Library und ermöglicht fundierte Technologie-Entscheidungen basierend auf realen Performance-Metriken.

## Aktueller Status

### ✅ Vollständig Implementiert
- **Python Lambda** (FastAPI + Mangum) - ✅ Produktionsbereit
- **TypeScript Lambda** (Express + serverless-http) - ✅ Produktionsbereit
- **Go Lambda** (Gin Framework) - ✅ Produktionsbereit
- **Kotlin Lambda** (Ktor) - ✅ Produktionsbereit
- **Shared Infrastructure** (DynamoDB, API Gateway) - ✅
- **CloudWatch Monitoring Dashboard** - ✅
- **Comprehensive Test Suite** (All runtimes: 450+ tests total) - ✅
- **Build & Deployment Scripts** - ✅
- **Benchmarking Tools** (Cold start, load testing, comparison) - ✅
- **CI/CD Pipeline** (GitHub Actions) - ✅
- **Local Development** (Docker Compose + LocalStack) - ✅

### 🔮 Zukünftige Erweiterungen
- **Performance Test Results** - In Arbeit (Tooling vorhanden)
- **Kotlin GraalVM Native Image** - Optional
- **OpenAPI/Swagger Docs** - Geplant
- **Cost Analysis Dashboard** - Geplant

## Architektur

```
┌──────────────────────────────────────────────────────────────────┐
│                         API Gateway                              │
│                     (REST API Endpoint)                          │
└────────┬──────────────┬──────────────┬──────────────┬───────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    ┌────────┐    ┌──────────┐   ┌────────┐    ┌────────┐
    │ Python │    │TypeScript│   │   Go   │    │ Kotlin │
    │FastAPI │    │ Express  │   │  Gin   │    │  Ktor  │
    │+Mangum │    │+serverles│   │Framework│   │ Server │
    └───┬────┘    └────┬─────┘   └───┬────┘    └───┬────┘
        │              │              │             │
        └──────────────┴──────────────┴─────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │  DynamoDB Table │
              │  (Items Store)  │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │ CloudWatch      │
              │ Dashboard +     │
              │ Metrics         │
              └─────────────────┘
```

## API Endpoints

Alle Runtimes implementieren identische REST API Endpoints:

### Health Check
- `GET /health` - Runtime-Status und Version
- `GET /{runtime}/health` - Runtime-spezifischer Health Check

### Items CRUD
- `POST /items` - Neuen Eintrag erstellen
- `GET /items` - Alle Einträge abrufen
- `GET /items/{id}` - Einzelnen Eintrag abrufen
- `PUT /items/{id}` - Eintrag aktualisieren
- `DELETE /items/{id}` - Eintrag löschen

### Metrics
- `GET /metrics` - Runtime Performance-Metriken

### Runtime-spezifische Pfade
- `/python/*` - Python Lambda Endpoints
- `/typescript/*` - TypeScript Lambda Endpoints
- `/go/*` - Go Lambda Endpoints (geplant)
- `/kotlin/*` - Kotlin Lambda Endpoints (geplant)

## Technologie-Stack

### Python Lambda
- **Runtime**: Python 3.11
- **Framework**: FastAPI
- **Lambda Adapter**: Mangum
- **AWS SDK**: boto3
- **Validation**: Pydantic
- **Observability**: AWS Lambda Powertools

### TypeScript Lambda
- **Runtime**: Node.js 20.x
- **Framework**: Express
- **Lambda Adapter**: serverless-http
- **AWS SDK**: AWS SDK v3
- **Build**: TypeScript + esbuild
- **Type Safety**: Full TypeScript strict mode

### Go Lambda
- **Runtime**: Go 1.21 (PROVIDED_AL2)
- **Framework**: Gin Web Framework
- **Lambda Adapter**: AWS Lambda Go API Proxy
- **AWS SDK**: AWS SDK for Go v1
- **Build**: Cross-compilation für Linux AMD64
- **Performance**: Native Binary, minimale Cold Starts

### Kotlin Lambda
- **Runtime**: Java 17 (PROVIDED_AL2 mit custom runtime)
- **Framework**: Ktor 2.3
- **Build Tool**: Gradle 8.5
- **AWS SDK**: AWS SDK for Java v2 (Enhanced DynamoDB Client)
- **Serialization**: kotlinx.serialization
- **Performance**: JVM-basiert, optional GraalVM Native Image

### Infrastructure (CDK)
- **Language**: TypeScript
- **CDK Constructs**: @vibtellect/aws-cdk-constructs
- **Testing**: Jest mit 80% Coverage Threshold
- **Stacks**:
  - SharedStack (DynamoDB + API Gateway)
  - RuntimeStack (pro Runtime)
  - MonitoringStack (Dashboard + Alarms)

## Projektstruktur

```
10-multi-runtime-api-benchmark/
├── cdk/                           # CDK Infrastructure Code
│   ├── bin/app.ts                 # CDK App Entry Point
│   ├── lib/
│   │   ├── shared-stack.ts        # Shared Resources
│   │   ├── runtime-stack.ts       # Runtime Stacks
│   │   ├── monitoring-stack.ts    # Monitoring
│   │   └── config.ts              # Konfiguration
│   ├── test/                      # CDK Tests
│   └── package.json
├── lambdas/                       # Lambda Implementierungen
│   ├── python/                    # Python + FastAPI
│   │   ├── src/
│   │   │   ├── app.py
│   │   │   ├── models/
│   │   │   └── utils/
│   │   ├── requirements.txt
│   │   └── pytest.ini
│   ├── typescript/                # TypeScript + Express
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── models/
│   │   │   └── utils/
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── go/                        # Go + Gin
│   │   ├── cmd/main.go
│   │   ├── internal/
│   │   │   ├── models/
│   │   │   └── utils/
│   │   ├── go.mod
│   │   └── Makefile
│   └── kotlin/                    # Kotlin + Ktor
│       ├── src/main/kotlin/
│       │   ├── Application.kt
│       │   ├── models/
│       │   └── utils/
│       ├── build.gradle.kts
│       └── settings.gradle.kts
├── scripts/                       # Build & Deployment
│   ├── build-all.sh
│   ├── build-python.sh
│   ├── build-typescript.sh
│   └── deploy.sh
└── docs/                          # Dokumentation
```

## Features

### 🎯 Benchmarking & Performance Testing

Comprehensive benchmarking tools for comparing runtime performance:

- **`scripts/benchmark-all.sh`** - Master orchestration script
- **`scripts/measure-cold-starts.sh`** - Cold start measurement (automated)
- **`scripts/load-test.js`** - k6 load testing for all runtimes
- **`scripts/compare-results.py`** - Generate comparison reports (Markdown + JSON)
- **`scripts/visualize-results.py`** - Create charts (matplotlib)

**Usage:**
```bash
# Run complete benchmark suite
./scripts/benchmark-all.sh

# Results saved in results/run-{timestamp}/
# - cold-starts.csv
# - load-test-{runtime}.json
# - comparison-report.md
# - dashboard.png (summary visualization)
```

See detailed benchmarking guide: [docs/BENCHMARKING.md](docs/BENCHMARKING.md)

### 🔄 CI/CD Pipeline

Automated testing and deployment with GitHub Actions:

- **`.github/workflows/test.yml`** - Run tests on PR (all runtimes + CDK)
- **`.github/workflows/lint.yml`** - Code quality checks (linting, formatting)
- **`.github/workflows/deploy.yml`** - Automated deployment with smoke tests

**Features:**
- Parallel test execution (Python, TypeScript, Go, Kotlin, CDK)
- Code coverage reporting (Codecov integration)
- Automated deployment to dev/staging/prod
- Post-deployment smoke tests
- GitHub Actions summaries with test results

### 🐳 Local Development

Docker Compose setup with LocalStack for local AWS services:

- **`docker-compose.yml`** - All services (LocalStack + 4 Lambda runtimes)
- **Hot reload** for all runtimes (auto-restart on code changes)
- **DynamoDB Admin UI** at http://localhost:8080
- **Isolated testing** without AWS costs

**Quick start:**
```bash
# Start all services
docker-compose up -d

# Access services:
# - Python:     http://localhost:8000
# - TypeScript: http://localhost:8001
# - Go:         http://localhost:8002
# - Kotlin:     http://localhost:8003
# - LocalStack: http://localhost:4566
# - DynamoDB UI: http://localhost:8080

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

See detailed local development guide: [docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md)

## Voraussetzungen

### Production Deployment
- **AWS Account** mit ausreichenden Berechtigungen
- **AWS CLI** konfiguriert
- **Node.js** >= 18.0.0 (für CDK und TypeScript Lambda)
- **npm** >= 9.0.0
- **Python** >= 3.11 (für Python Lambda)
- **Go** >= 1.21 (für Go Lambda)
- **Java** >= 17 + **Gradle** >= 8.5 (für Kotlin Lambda)
- **AWS CDK** >= 2.120.0

### Local Development (Optional)
- **Docker** >= 20.10
- **Docker Compose** >= 2.0

### Benchmarking (Optional)
- **k6** for load testing
- **Python 3.11+** with matplotlib for visualizations

## Installation

### 1. Dependencies installieren

#### CDK Dependencies
```bash
cd cdk
npm install
```

#### Python Lambda Dependencies
```bash
cd lambdas/python
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### TypeScript Lambda Dependencies
```bash
cd lambdas/typescript
npm install
```

#### Go Lambda Dependencies
```bash
cd lambdas/go
go mod download
go mod tidy
```

#### Kotlin Lambda Dependencies
```bash
cd lambdas/kotlin
./gradlew build  # Downloads dependencies automatically
```

### 2. Build

Alle Lambdas bauen:
```bash
./scripts/build-all.sh
```

Oder einzeln:
```bash
./scripts/build-python.sh
./scripts/build-typescript.sh
./scripts/build-go.sh
./scripts/build-kotlin.sh
./scripts/build-typescript.sh
```

### 3. Deployment

#### Einfaches Deployment (dev)
```bash
./scripts/deploy.sh
```

#### Mit spezifischem Environment
```bash
./scripts/deploy.sh prod
```

#### Mit Alert Email
```bash
./scripts/deploy.sh prod your-email@example.com
```

#### Manuelles Deployment mit CDK
```bash
cd cdk

# Bootstrap (einmalig pro Account/Region)
npx cdk bootstrap --context environment=dev

# Deploy einzelne Stacks
npx cdk deploy MultiRuntimeBenchmarkSharedStack --context environment=dev
npx cdk deploy MultiRuntimeBenchmarkPythonStack --context environment=dev
npx cdk deploy MultiRuntimeBenchmarkTypeScriptStack --context environment=dev
npx cdk deploy MultiRuntimeBenchmarkMonitoringStack --context environment=dev

# Oder alle zusammen
npx cdk deploy --all --context environment=dev
```

## Verwendung

### API Testen

Nach dem Deployment erhalten Sie API URLs in den CloudFormation Outputs:

```bash
# Python Lambda Health Check
curl https://YOUR_API_ID.execute-api.REGION.amazonaws.com/dev/python/health

# TypeScript Lambda Health Check
curl https://YOUR_API_ID.execute-api.REGION.amazonaws.com/dev/typescript/health

# Item erstellen (Python)
curl -X POST https://YOUR_API_ID.execute-api.REGION.amazonaws.com/dev/python/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Item","description":"Test Description","price":19.99}'

# Items abrufen
curl https://YOUR_API_ID.execute-api.REGION.amazonaws.com/dev/python/items

# Metrics abrufen
curl https://YOUR_API_ID.execute-api.REGION.amazonaws.com/dev/python/metrics
```

### CloudWatch Dashboard

Das Monitoring Dashboard finden Sie in der AWS Console unter:
- CloudWatch → Dashboards → `multi-runtime-benchmark-{environment}`

Verfügbare Metriken:
- Cold Start Duration Vergleich
- Request Duration (Average, P95, P99)
- Memory Utilization
- Error Rates
- Invocation Counts
- DynamoDB Metrics

### Alarms

Automatische Alarms werden erstellt für:
- Error Rate > 1%
- P99 Latency > 1000ms
- Throttling Events
- High Memory Utilization

## Performance Metriken

Das System erfasst folgende Metriken:

### Cold Start Metriken
- Initialisierungsdauer beim ersten Request
- Häufigkeit von Cold Starts
- Memory-Allocation während Init

### Request Performance
- Response-Zeit (P50, P95, P99)
- Durchsatz (Requests/Sekunde)
- Fehlerrate

### Ressourcennutzung
- Memory-Verbrauch (Idle/Peak)
- CPU-Utilization
- Package-Größe

### Kosten
- Kosten pro 1M Requests
- GB-Sekunden Verbrauch
- Gesamtkosten pro Runtime

## Testing

### Python Tests
```bash
cd lambdas/python
pytest
pytest --cov=src --cov-report=html
```

### TypeScript Tests
```bash
cd lambdas/typescript
npm test
npm run test:coverage
```

### CDK Tests
```bash
cd cdk
npm test
npm run test:coverage
```

## Entwicklung

### Neue Runtime hinzufügen

1. Lambda-Implementierung erstellen
2. Build-Script in `scripts/` hinzufügen
3. CDK Config in `cdk/lib/config.ts` erweitern
4. RuntimeStack deployen

### Lokales Testing

#### Python
```bash
cd lambdas/python
source venv/bin/activate
uvicorn src.app:app --reload
```

#### TypeScript
```bash
cd lambdas/typescript
npm run watch  # In einem Terminal
# In anderem Terminal:
node dist/index.js
```

## Cleanup

Alle Ressourcen löschen:
```bash
cd cdk
npx cdk destroy --all --context environment=dev
```

## Kosten

Geschätzte monatliche Kosten bei moderater Nutzung (ca. 100.000 Requests):
- **Lambda**: ~$0.20 (128MB, 100ms average)
- **DynamoDB**: ~$0.25 (Pay-per-Request)
- **API Gateway**: ~$0.35
- **CloudWatch**: ~$0.50

**Gesamt**: ~$1.30/Monat (dev environment)

Produktionskosten skalieren mit der Nutzung.

## Troubleshooting

### Build Fehler

**Python**: Stelle sicher, dass virtuelle Umgebung aktiviert ist
```bash
source venv/bin/activate
```

**TypeScript**: Node Modules löschen und neu installieren
```bash
rm -rf node_modules package-lock.json
npm install
```

### Deployment Fehler

**CDK Bootstrap erforderlich**:
```bash
npx cdk bootstrap
```

**IAM Permissions**: Stelle sicher, dass AWS Credentials korrekt konfiguriert sind

### Runtime Errors

Logs anzeigen:
```bash
# CloudWatch Logs
aws logs tail /aws/lambda/multi-runtime-benchmark-python-dev --follow
```

## Roadmap

- [ ] Go Lambda Implementierung (Gin Framework)
- [ ] Kotlin Lambda Implementierung (Ktor + GraalVM Native Image)
- [ ] Performance Test Suite (k6)
- [ ] Integration Tests
- [ ] CI/CD Pipeline (GitHub Actions)
- [ ] OpenAPI/Swagger Dokumentation
- [ ] Cost Explorer Integration
- [ ] Load Testing Automation
- [ ] Benchmark Ergebnisse visualisieren

## Contributing

1. Fork das Repository
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Changes committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## Lizenz

MIT License - siehe LICENSE Datei

## Autoren

**vibtellect** - AWS Portfolio Setup

## Acknowledgments

- AWS CDK Team
- FastAPI Team
- Express.js Team
- Alle Open Source Contributors

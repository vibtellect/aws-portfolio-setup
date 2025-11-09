# Deployment Guide

## Voraussetzungen

### AWS Account Setup
1. AWS Account mit Administrator-Zugriff
2. AWS CLI installiert und konfiguriert
3. AWS Credentials konfiguriert (`~/.aws/credentials`)

```bash
# AWS CLI installieren (falls nicht vorhanden)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Credentials konfigurieren
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region: us-east-1
# Default output format: json
```

### Software Requirements
- Node.js >= 18.0.0
- npm >= 9.0.0
- Python >= 3.11
- Git

```bash
# Versionen prüfen
node --version   # v18.x oder höher
npm --version    # v9.x oder höher
python3 --version # Python 3.11 oder höher
```

## Quick Start

### Option 1: Automatisches Deployment (Empfohlen)

```bash
# Repository klonen (falls noch nicht geschehen)
cd projects/10-multi-runtime-api-benchmark

# Deployment ausführen
./scripts/deploy.sh dev

# Mit Alert Email (optional)
./scripts/deploy.sh dev your-email@example.com
```

Das Skript führt automatisch aus:
1. Build aller Lambda-Funktionen
2. CDK Dependencies Installation
3. CDK Bootstrap (falls erforderlich)
4. Stack Deployment

### Option 2: Manuelles Deployment

```bash
# 1. Lambda Functions bauen
./scripts/build-all.sh

# 2. CDK Dependencies installieren
cd cdk
npm install
npm run build

# 3. CDK Bootstrap (einmalig pro Account/Region)
npx cdk bootstrap

# 4. Stacks deployen
npx cdk deploy --all --context environment=dev
```

## Umgebungen

### Development (dev)
```bash
./scripts/deploy.sh dev
```

Eigenschaften:
- Kürzeste Log-Retention (7 Tage)
- Keine Point-in-Time Recovery
- RemovalPolicy: DESTROY
- Keine Alarms per Default

### Staging
```bash
./scripts/deploy.sh staging
```

Eigenschaften:
- Mittlere Log-Retention (14 Tage)
- Point-in-Time Recovery aktiviert
- RemovalPolicy: RETAIN
- Alarms aktiviert

### Production
```bash
./scripts/deploy.sh prod your-alert-email@company.com
```

Eigenschaften:
- Längste Log-Retention (14 Tage)
- Point-in-Time Recovery aktiviert
- RemovalPolicy: RETAIN
- Alle Alarms aktiviert
- SNS Notifications erforderlich

## Deployment-Optionen

### Einzelne Stacks deployen

```bash
cd cdk

# Nur Shared Stack
npx cdk deploy MultiRuntimeBenchmarkSharedStack --context environment=dev

# Nur Python Stack
npx cdk deploy MultiRuntimeBenchmarkPythonStack --context environment=dev

# Nur TypeScript Stack
npx cdk deploy MultiRuntimeBenchmarkTypeScriptStack --context environment=dev

# Nur Monitoring Stack
npx cdk deploy MultiRuntimeBenchmarkMonitoringStack --context environment=dev
```

### Mit Alert Email

```bash
npx cdk deploy --all \
  --context environment=prod \
  --context alertEmail=alerts@example.com
```

### Ohne Bestätigung (CI/CD)

```bash
npx cdk deploy --all \
  --context environment=dev \
  --require-approval never
```

### Dry-Run (Änderungen anzeigen)

```bash
# Änderungen anzeigen ohne zu deployen
npx cdk diff --context environment=dev

# CloudFormation Template generieren
npx cdk synth --context environment=dev
```

## Post-Deployment

### 1. API URLs abrufen

Die API URLs werden in den CloudFormation Outputs angezeigt:

```bash
# Aus CDK Output
aws cloudformation describe-stacks \
  --stack-name multi-runtime-benchmark-shared-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text
```

Oder im AWS Console:
- CloudFormation → Stacks → multi-runtime-benchmark-shared-dev → Outputs

### 2. API testen

```bash
# API URL speichern
export API_URL=$(aws cloudformation describe-stacks \
  --stack-name multi-runtime-benchmark-shared-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

# Health Check
curl ${API_URL}python/health
curl ${API_URL}typescript/health

# Item erstellen
curl -X POST ${API_URL}python/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","price":9.99}'
```

### 3. CloudWatch Dashboard öffnen

```bash
# Dashboard URL
echo "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=multi-runtime-benchmark-dev"
```

### 4. Logs überprüfen

```bash
# Python Lambda Logs
aws logs tail /aws/lambda/multi-runtime-benchmark-python-dev --follow

# TypeScript Lambda Logs
aws logs tail /aws/lambda/multi-runtime-benchmark-typescript-dev --follow
```

## Troubleshooting

### Bootstrap Fehler

**Problem**: `"CDKToolkit" stack does not exist`

**Lösung**:
```bash
npx cdk bootstrap aws://ACCOUNT_ID/REGION
```

### Deployment Timeout

**Problem**: Stack deployment timeout

**Lösung**:
```bash
# Manuell mit längeren Timeout
aws cloudformation wait stack-create-complete \
  --stack-name multi-runtime-benchmark-shared-dev

# Oder einzelne Ressourcen überprüfen
aws cloudformation describe-stack-events \
  --stack-name multi-runtime-benchmark-shared-dev
```

### Lambda Package zu groß

**Problem**: Code package exceeds maximum size

**Lösung für Python**:
```bash
cd lambdas/python
# Dependencies in Layer auslagern (falls nötig)
pip install -r requirements.txt -t python/lib/python3.11/site-packages/
zip -r layer.zip python
```

**Lösung für TypeScript**:
```bash
cd lambdas/typescript
# Bundle optimieren
npm run bundle
# Größe prüfen
du -sh dist/
```

### IAM Permissions Fehler

**Problem**: Access Denied during deployment

**Lösung**:
```bash
# Erforderliche IAM Permissions:
# - cloudformation:*
# - lambda:*
# - dynamodb:*
# - apigateway:*
# - iam:*
# - logs:*
# - s3:* (für CDK Assets)

# Managed Policy verwenden:
# arn:aws:iam::aws:policy/AdministratorAccess (nur für Dev/Test!)
```

### DynamoDB Table existiert bereits

**Problem**: Table already exists

**Lösung**:
```bash
# Table manuell löschen (VORSICHT: Daten gehen verloren!)
aws dynamodb delete-table --table-name dev-benchmark-items

# Oder Stack löschen und neu deployen
npx cdk destroy MultiRuntimeBenchmarkSharedStack
npx cdk deploy MultiRuntimeBenchmarkSharedStack
```

## Updates & Rollback

### Code Updates deployen

```bash
# 1. Code ändern
# 2. Lambda neu bauen
./scripts/build-all.sh

# 3. Stack aktualisieren
cd cdk
npx cdk deploy --all --context environment=dev
```

### Rollback

```bash
# Option 1: CDK Rollback (wenn Deployment fehlschlägt)
# CDK rollt automatisch zurück bei Fehler

# Option 2: Manueller Rollback via CloudFormation
aws cloudformation cancel-update-stack \
  --stack-name multi-runtime-benchmark-python-dev

# Option 3: Zu vorheriger Version deployen
git checkout <previous-commit>
./scripts/deploy.sh dev
```

### Zero-Downtime Updates

```bash
# Lambda Versioning nutzen
cd cdk/lib/runtime-stack.ts
# Uncomment: version: lambda.Version.from...

# Alias für Prod Traffic
# Alias für Testing

# Gradual Rollout
# Traffic shifting: 10% → 50% → 100%
```

## Cleanup

### Einzelne Stacks löschen

```bash
cd cdk

# Stack löschen
npx cdk destroy MultiRuntimeBenchmarkMonitoringStack
npx cdk destroy MultiRuntimeBenchmarkPythonStack
npx cdk destroy MultiRuntimeBenchmarkTypeScriptStack
npx cdk destroy MultiRuntimeBenchmarkSharedStack
```

### Alle Stacks löschen

```bash
npx cdk destroy --all --context environment=dev

# Oder via Script
./scripts/cleanup.sh dev
```

### Manuelle Ressourcen-Bereinigung

Manchmal müssen Ressourcen manuell gelöscht werden:

```bash
# S3 Buckets (CDK Assets)
aws s3 ls | grep cdk
aws s3 rb s3://cdk-hnb659fds-assets-ACCOUNT-REGION --force

# CloudWatch Log Groups (wenn RETAIN Policy)
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/multi-runtime
aws logs delete-log-group --log-group-name /aws/lambda/multi-runtime-benchmark-python-dev

# DynamoDB Tables (wenn RETAIN Policy)
aws dynamodb delete-table --table-name dev-benchmark-items
```

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy Multi-Runtime Benchmark

on:
  push:
    branches: [main]
    paths:
      - 'projects/10-multi-runtime-api-benchmark/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Build and Deploy
        run: |
          cd projects/10-multi-runtime-api-benchmark
          ./scripts/deploy.sh prod ${{ secrets.ALERT_EMAIL }}
```

### AWS CodePipeline

```bash
# CodePipeline erstellen
aws codepipeline create-pipeline \
  --pipeline file://pipeline-config.json

# pipeline-config.json:
# - Source: GitHub/CodeCommit
# - Build: CodeBuild (./scripts/build-all.sh)
# - Deploy: CDK Deploy
```

## Monitoring nach Deployment

### Health Checks

```bash
# Automatischer Health Check nach Deployment
./scripts/health-check.sh dev

# Manueller Check
curl https://YOUR_API.execute-api.us-east-1.amazonaws.com/dev/python/health
curl https://YOUR_API.execute-api.us-east-1.amazonaws.com/dev/typescript/health
```

### Metrics überprüfen

```bash
# CloudWatch Metrics abrufen
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=multi-runtime-benchmark-python-dev \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-02T00:00:00Z \
  --period 3600 \
  --statistics Sum
```

## Best Practices

### 1. Separate Accounts/Regions
- Dev: Account A, us-east-1
- Staging: Account A, us-west-2
- Prod: Account B, us-east-1 + us-west-2

### 2. Tag-Strategie
```typescript
Tags.of(app).add('Project', 'MultiRuntimeBenchmark');
Tags.of(app).add('Environment', environment);
Tags.of(app).add('CostCenter', 'Engineering');
Tags.of(app).add('Owner', 'DevOps');
```

### 3. Backup vor Production Deployment
```bash
# DynamoDB Backup
aws dynamodb create-backup \
  --table-name prod-benchmark-items \
  --backup-name pre-deployment-backup-$(date +%Y%m%d)
```

### 4. Deployment Windows
- Dev: Jederzeit
- Staging: Werktags 9-17 Uhr
- Prod: Wartungsfenster (z.B. Sonntag 2-4 Uhr)

### 5. Deployment Checkliste
- [ ] Tests lokal ausgeführt
- [ ] CDK diff überprüft
- [ ] Backup erstellt (Prod)
- [ ] Stakeholder informiert
- [ ] Deployment durchgeführt
- [ ] Health Checks erfolgreich
- [ ] Monitoring überprüft
- [ ] Rollback Plan bereit

## Support

Bei Problemen:
1. CloudWatch Logs prüfen
2. CloudFormation Events überprüfen
3. GitHub Issues erstellen
4. AWS Support kontaktieren (bei AWS-spezifischen Problemen)

# LocalStack Integration Testing

Dieses Projekt verwendet [LocalStack](https://localstack.cloud/) für Integration-Tests der AWS CDK Constructs. LocalStack ermöglicht es, AWS Services lokal zu emulieren, ohne echte AWS-Ressourcen zu erstellen.

## Inhaltsverzeichnis

- [Voraussetzungen](#voraussetzungen)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Verfügbare Scripts](#verfügbare-scripts)
- [Test-Struktur](#test-struktur)
- [Einen neuen Integration-Test schreiben](#einen-neuen-integration-test-schreiben)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Voraussetzungen

- **Docker**: LocalStack läuft in einem Docker Container
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0

## Installation

1. **Projekt-Dependencies installieren:**
   ```bash
   npm install
   ```

2. **Docker sicherstellen:**
   ```bash
   docker --version
   # Docker version 20.10.0 oder höher empfohlen
   ```

## Quick Start

### 1. LocalStack starten

```bash
npm run localstack:start
```

Dies startet LocalStack im Hintergrund mit allen benötigten AWS Services:
- S3
- DynamoDB
- Lambda
- SQS
- SNS
- CloudWatch
- KMS
- API Gateway
- Cognito
- CloudFront
- Route53

### 2. LocalStack Gesundheitsprüfung

```bash
npm run localstack:health
```

Zeigt den Status aller verfügbaren Services.

### 3. Integration-Tests ausführen

```bash
npm run test:integration
```

Oder alles in einem Schritt:

```bash
npm run localstack:test
```

Dies startet LocalStack, wartet bis es bereit ist, und führt dann alle Integration-Tests aus.

### 4. LocalStack stoppen

```bash
npm run localstack:stop
```

## Verfügbare Scripts

| Script | Beschreibung |
|--------|--------------|
| `npm run localstack:start` | Startet LocalStack im Hintergrund |
| `npm run localstack:stop` | Stoppt LocalStack |
| `npm run localstack:restart` | Startet LocalStack neu |
| `npm run localstack:logs` | Zeigt LocalStack Logs (Strg+C zum Beenden) |
| `npm run localstack:health` | Zeigt Service-Status |
| `npm run test:integration` | Führt Integration-Tests aus |
| `npm run test:integration:watch` | Integration-Tests im Watch-Mode |
| `npm run localstack:test` | Startet LocalStack und führt Tests aus |

## Test-Struktur

```
test/
├── integration/
│   ├── helpers/
│   │   ├── localstack-config.ts       # LocalStack Konfiguration
│   │   └── cdk-deploy-helper.ts       # CDK Deployment Utilities
│   ├── setup/
│   │   ├── global-setup.ts            # Test Setup
│   │   └── global-teardown.ts         # Test Teardown
│   └── primitives/
│       ├── storage/
│       │   └── s3-bucket-secure.integration.test.ts
│       ├── database/
│       │   └── dynamodb-table-standard.integration.test.ts
│       └── messaging/
│           └── sqs-queue-encrypted.integration.test.ts
└── primitives/                        # Unit Tests
    └── ...
```

## Einen neuen Integration-Test schreiben

### Beispiel: S3 Bucket Test

```typescript
import { describe, test, beforeAll, afterAll, expect } from '@jest/globals';
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';
import { S3BucketSecure } from '../../../src/primitives/storage/s3-bucket-secure';
import {
  createTestApp,
  createTestStack,
  deployStack,
  destroyStack,
  addOutput,
} from '../helpers/cdk-deploy-helper';
import {
  localstackConfig,
  waitForLocalStack,
  generateTestResourceName,
} from '../helpers/localstack-config';

describe('S3BucketSecure Integration Test', () => {
  const stackName = generateTestResourceName('S3Test');
  let s3Client: S3Client;
  let bucketName: string;

  beforeAll(async () => {
    // Warte auf LocalStack
    await waitForLocalStack();

    // Erstelle AWS Client
    s3Client = new S3Client(localstackConfig);

    // Erstelle und deploye Stack
    const app = createTestApp();
    const stack = createTestStack(app, stackName);

    const bucket = new S3BucketSecure(stack, 'TestBucket');
    addOutput(stack, 'BucketName', bucket.bucketName);

    const result = await deployStack(stack, stackName);
    bucketName = result.outputs.BucketName;
  }, 120000); // 2 Minuten Timeout

  afterAll(async () => {
    // Cleanup
    await destroyStack(stackName);
    s3Client.destroy();
  });

  test('bucket should exist', async () => {
    const command = new HeadBucketCommand({ Bucket: bucketName });
    await expect(s3Client.send(command)).resolves.toBeDefined();
  });
});
```

### Wichtige Punkte:

1. **Unique Resource Names**: Verwende `generateTestResourceName()` für eindeutige Namen
2. **Timeout**: Setze höhere Timeouts für `beforeAll` (120000ms = 2 Minuten)
3. **Cleanup**: Verwende `afterAll` um Ressourcen zu bereinigen
4. **LocalStack Config**: Verwende `localstackConfig` für AWS SDK Clients
5. **Wait for LocalStack**: Rufe `waitForLocalStack()` in `beforeAll` auf

## Troubleshooting

### LocalStack startet nicht

```bash
# Logs prüfen
npm run localstack:logs

# Container Status prüfen
docker ps -a

# LocalStack neu starten
npm run localstack:stop
npm run localstack:start
```

### Tests schlagen fehl mit Connection Error

1. Prüfe ob LocalStack läuft:
   ```bash
   npm run localstack:health
   ```

2. Prüfe den Endpoint:
   ```bash
   curl http://localhost:4566/_localstack/health
   ```

3. Stelle sicher, dass Port 4566 nicht bereits belegt ist:
   ```bash
   lsof -i :4566
   ```

### CDK Deployment schlägt fehl

1. Prüfe AWS Credentials (für LocalStack sind Test-Credentials ausreichend):
   ```bash
   export AWS_ACCESS_KEY_ID=test
   export AWS_SECRET_ACCESS_KEY=test
   ```

2. Verwende `AWS_ENDPOINT_URL`:
   ```bash
   export AWS_ENDPOINT_URL=http://localhost:4566
   ```

### Speicherprobleme bei LocalStack

LocalStack benötigt ausreichend Docker Memory. Erhöhe Docker Memory auf mindestens 4GB:
- Docker Desktop → Settings → Resources → Memory

## Best Practices

### 1. Ressourcen-Isolation

Jeder Test sollte eigene Ressourcen erstellen und bereinigen:

```typescript
beforeAll(async () => {
  stackName = generateTestResourceName('MyTest');
  // Deploy stack...
});

afterAll(async () => {
  await destroyStack(stackName);
});
```

### 2. Test-Unabhängigkeit

Tests sollten unabhängig voneinander laufen können:

```typescript
// ❌ SCHLECHT - Tests teilen Ressourcen
describe('Tests', () => {
  const bucketName = 'shared-bucket';

  test('test1', () => { /* uses bucketName */ });
  test('test2', () => { /* uses bucketName */ });
});

// ✅ GUT - Jeder Test hat eigene Ressourcen
describe('Tests', () => {
  test('test1', async () => {
    const bucketName = generateTestResourceName('test1');
    // ...
  });

  test('test2', async () => {
    const bucketName = generateTestResourceName('test2');
    // ...
  });
});
```

### 3. Service-Verfügbarkeit prüfen

Prüfe immer, ob ein Service verfügbar ist:

```typescript
beforeAll(async () => {
  await waitForLocalStack();

  const isAvailable = await isServiceAvailable('s3');
  if (!isAvailable) {
    throw new Error('S3 service not available');
  }
});
```

### 4. Angemessene Timeouts

Integration-Tests brauchen längere Timeouts:

```typescript
// Jest Konfiguration
testTimeout: 120000, // 2 Minuten

// In Tests
beforeAll(async () => {
  // ...
}, 120000);
```

### 5. Detailliertes Logging

Aktiviere Logging für besseres Debugging:

```typescript
console.log(`Deploying stack: ${stackName}`);
console.log(`Created bucket: ${bucketName}`);
```

## Weitere Ressourcen

- [LocalStack Dokumentation](https://docs.localstack.cloud/)
- [AWS SDK für JavaScript v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [AWS CDK Dokumentation](https://docs.aws.amazon.com/cdk/)
- [Jest Dokumentation](https://jestjs.io/)

## Unterstützte AWS Services

Die folgende Tabelle zeigt die in LocalStack verfügbaren Services:

| Service | Status | Integration Tests |
|---------|--------|-------------------|
| S3 | ✅ | ✅ |
| DynamoDB | ✅ | ✅ |
| Lambda | ✅ | ⏳ |
| SQS | ✅ | ✅ |
| SNS | ✅ | ⏳ |
| CloudWatch | ✅ | ⏳ |
| KMS | ✅ | ⏳ |
| API Gateway | ✅ | ⏳ |
| Cognito | ✅ | ⏳ |
| CloudFront | ✅ | ⏳ |
| Route53 | ✅ | ⏳ |

Legende:
- ✅ Verfügbar und getestet
- ⏳ Verfügbar, Tests ausstehend
- ❌ Nicht verfügbar

## Lizenz

MIT

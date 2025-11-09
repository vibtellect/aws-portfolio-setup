# LocalStack Integration Testing - Quick Start Guide

Schnellanleitung für die Verwendung der LocalStack-Testumgebung.

## 🚀 In 3 Schritten starten

### 1. Dependencies installieren

```bash
cd 04-cdk-constructs
npm install
```

### 2. LocalStack starten

```bash
npm run localstack:start
```

Warte ~10 Sekunden, bis LocalStack vollständig gestartet ist.

### 3. Tests ausführen

```bash
npm run test:integration
```

## 🎯 Alternativ: Alles in einem Schritt

```bash
npm run localstack:test
```

Dies startet LocalStack automatisch und führt alle Integration-Tests aus.

## 📦 Mit Make (empfohlen)

Wenn du `make` installiert hast:

```bash
# Alles einrichten
make install

# LocalStack starten
make localstack-start

# Integration-Tests ausführen
make test-integration

# Oder alles zusammen
make localstack-test
```

## ✅ Schnelltest

Prüfe ob alles funktioniert:

```bash
# 1. LocalStack starten
npm run localstack:start

# 2. Health-Check (nach ~10 Sekunden)
npm run localstack:health

# 3. Einen einzelnen Test ausführen
npm test -- test/integration/primitives/storage/s3-bucket-secure.integration.test.ts

# 4. LocalStack stoppen
npm run localstack:stop
```

## 🔍 Troubleshooting

### LocalStack läuft nicht?

```bash
# Status prüfen
docker ps

# Logs ansehen
npm run localstack:logs

# Neustart
npm run localstack:restart
```

### Tests schlagen fehl?

```bash
# Health-Check
curl http://localhost:4566/_localstack/health

# Detaillierte Logs
docker-compose logs -f localstack
```

### Port bereits belegt?

```bash
# Port 4566 freigeben
lsof -i :4566
# Prozess beenden oder anderen Port in docker-compose.yml verwenden
```

## 📚 Weitere Informationen

Siehe [LOCALSTACK_TESTING.md](./LOCALSTACK_TESTING.md) für detaillierte Dokumentation.

## 🛠️ Entwicklung

### Neuen Test hinzufügen

1. Erstelle eine neue Datei in `test/integration/primitives/[kategorie]/`
2. Verwende das Template aus einem existierenden Test
3. Führe den Test aus: `npm run test:integration`

### Beispiel-Template

```typescript
import { describe, test, beforeAll, afterAll, expect } from '@jest/globals';
import { YourConstruct } from '../../../../src/primitives/...';
import {
  createTestApp,
  createTestStack,
  deployStack,
  destroyStack,
} from '../../helpers/cdk-deploy-helper';
import {
  localstackConfig,
  waitForLocalStack,
  generateTestResourceName,
} from '../../helpers/localstack-config';

describe('YourConstruct - LocalStack Integration', () => {
  const stackName = generateTestResourceName('YourTest');

  beforeAll(async () => {
    await waitForLocalStack();
    // Setup...
  }, 120000);

  afterAll(async () => {
    await destroyStack(stackName);
  });

  test('should work', async () => {
    // Test implementation...
  });
});
```

## 🎓 Best Practices

1. **Immer Cleanup**: Verwende `afterAll` um Ressourcen zu bereinigen
2. **Unique Namen**: Nutze `generateTestResourceName()` für eindeutige Ressourcen
3. **Timeouts**: Integration-Tests benötigen längere Timeouts (120s)
4. **Service-Check**: Prüfe Service-Verfügbarkeit mit `isServiceAvailable()`
5. **Logging**: Nutze `console.log()` für besseres Debugging

## 🌟 Nützliche Befehle

```bash
# Nur S3-Tests ausführen
npm test -- test/integration/primitives/storage

# Tests im Watch-Mode
npm run test:integration:watch

# LocalStack Logs live
npm run localstack:logs

# Alle Ressourcen löschen und neu starten
npm run localstack:stop
docker volume prune -f
npm run localstack:start
```

## ✨ Tipps

- **Docker Memory**: Stelle sicher, dass Docker mindestens 4GB RAM hat
- **Performance**: LocalStack kann beim ersten Start langsam sein
- **Debugging**: Nutze `DEBUG=1` in der `.env` für detaillierte Logs
- **CI/CD**: GitHub Actions Workflow ist bereits konfiguriert

Happy Testing! 🎉

# TDD Guide: Test-Driven Development für CDK Constructs

> **Für:** Entwickler die CDK Constructs mit TDD entwickeln wollen
> **Prinzip:** RED → GREEN → REFACTOR
> **Ziel:** Qualitativ hochwertiger, gut getesteter Code

---

## 🎯 Was ist TDD?

**Test-Driven Development (TDD)** ist eine Entwicklungsmethode bei der **Tests ZUERST** geschrieben werden, bevor der eigentliche Code implementiert wird.

### Der TDD-Zyklus (Red-Green-Refactor)

```
┌─────────────┐
│  1. RED     │ Schreibe einen Test der fehlschlägt
│  ❌ Test    │ (weil der Code noch nicht existiert)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  2. GREEN   │ Schreibe minimalen Code um Test zu bestehen
│  ✅ Test    │ (nicht perfekt, nur funktionierend)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  3. REFACTOR│ Verbessere den Code (ohne Funktionalität zu ändern)
│  🔧 Code    │ Tests bleiben grün!
└──────┬──────┘
       │
       └──────► Repeat für nächstes Feature
```

---

## 🚀 Quick Start: Dein erstes Construct mit TDD

### Setup

```bash
# 1. Navigiere zum Construct-Ordner
cd 04-cdk-constructs/primitives/observability/log-group-short-retention

# 2. Installiere Dependencies
npm install

# 3. Starte TDD Watch Mode
npm run test:tdd
```

Der Watch Mode:
- ✅ Läuft Tests automatisch bei Datei-Änderungen
- ✅ Zeigt sofort Feedback (rot/grün)
- ✅ Keine Coverage (schneller)
- ✅ Verbose Output (sieht alle Tests)

---

## 📝 TDD Workflow: Praktisches Beispiel

### Beispiel: LogGroupShortRetention Construct

#### 🔴 Phase 1: RED (Test schreiben)

**Datei:** `test/unit.test.ts`

```typescript
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LogGroupShortRetention } from '../src';

describe('LogGroupShortRetention', () => {
  let app: App;
  let stack: Stack;

  beforeEach(() => {
    app = new App();
    stack = new Stack(app, 'TestStack');
  });

  // ========================================
  // TEST 1: Grundlegende Funktionalität
  // ========================================
  test('creates log group with default settings', () => {
    // Arrange & Act
    new LogGroupShortRetention(stack, 'TestLogs');

    // Assert
    const template = Template.fromStack(stack);

    // Erwartung: Genau 1 CloudWatch Log Group wird erstellt
    template.resourceCountIs('AWS::Logs::LogGroup', 1);
  });
});
```

**Führe Test aus:**
```bash
npm run test:tdd
```

**Erwartetes Ergebnis:** ❌ **RED** - Test schlägt fehl
```
FAIL  test/unit.test.ts
  ● Test suite failed to run
    Cannot find module '../src'
```

✅ **Das ist gut!** Genau so soll es sein. Der Test ist rot, weil der Code noch nicht existiert.

---

#### 🟢 Phase 2: GREEN (Minimalen Code schreiben)

**Datei:** `src/index.ts`

```typescript
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as logs from 'aws-cdk-lib/aws-logs';

export interface LogGroupShortRetentionProps {
  // Noch leer - erstmal minimal
}

export class LogGroupShortRetention extends Construct {
  public readonly logGroup: logs.LogGroup;
  public readonly logGroupArn: string;
  public readonly logGroupName: string;

  constructor(scope: Construct, id: string, props: LogGroupShortRetentionProps = {}) {
    super(scope, id);

    // Minimal: Erstelle eine Log-Gruppe
    this.logGroup = new logs.LogGroup(this, 'LogGroup');

    // Setze Outputs
    this.logGroupArn = this.logGroup.logGroupArn;
    this.logGroupName = this.logGroup.logGroupName;
  }
}
```

**Führe Test aus:**
```bash
# Test läuft automatisch durch Watch Mode!
```

**Erwartetes Ergebnis:** ✅ **GREEN** - Test besteht!
```
PASS  test/unit.test.ts
  LogGroupShortRetention
    ✓ creates log group with default settings (XXms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

✅ **Perfekt!** Der Test ist grün. Der minimalste Code der funktioniert.

---

#### 🔧 Phase 3: REFACTOR (Code verbessern)

Jetzt können wir den Code verbessern, während die Tests grün bleiben.

**Datei:** `src/index.ts`

```typescript
export class LogGroupShortRetention extends Construct {
  // ... (Properties bleiben gleich)

  constructor(scope: Construct, id: string, props: LogGroupShortRetentionProps = {}) {
    super(scope, id);

    // REFACTOR: Füge intelligente Defaults hinzu
    const retentionDays = props.retentionDays ?? logs.RetentionDays.TWO_WEEKS;
    const removalPolicy = props.removalPolicy ?? this.getDefaultRemovalPolicy();

    this.logGroup = new logs.LogGroup(this, 'LogGroup', {
      retention: retentionDays,
      removalPolicy: removalPolicy,
    });

    // Tags für besseres Cost Management
    cdk.Tags.of(this.logGroup).add('ManagedBy', 'CDK');
    cdk.Tags.of(this.logGroup).add('Construct', 'LogGroupShortRetention');

    this.logGroupArn = this.logGroup.logGroupArn;
    this.logGroupName = this.logGroup.logGroupName;
  }

  private getDefaultRemovalPolicy(): cdk.RemovalPolicy {
    const stack = cdk.Stack.of(this);
    const stackName = stack.stackName.toLowerCase();
    const devPatterns = ['dev', 'test', 'sandbox'];
    const isDev = devPatterns.some(pattern => stackName.includes(pattern));
    return isDev ? cdk.RemovalPolicy.DESTROY : cdk.RemovalPolicy.RETAIN;
  }
}
```

**Ergebnis:** ✅ **Test bleibt grün!**

Der Code ist jetzt besser (Defaults, Tags, Environment-Detection), aber die Tests bestehen immer noch.

---

#### 🔄 Wiederholen: Nächstes Feature

Jetzt fügen wir das nächste Feature hinzu: **Retention Days validieren**

##### 🔴 RED: Test für neues Feature

```typescript
test('sets correct retention days', () => {
  // Arrange & Act
  new LogGroupShortRetention(stack, 'TestLogs', {
    retentionDays: logs.RetentionDays.TWO_WEEKS,
  });

  const template = Template.fromStack(stack);

  // Assert
  template.hasResourceProperties('AWS::Logs::LogGroup', {
    RetentionInDays: 14,
  });
});
```

**Ergebnis:** ❌ **RED** - Test schlägt fehl (Props-Interface fehlt noch)

##### 🟢 GREEN: Props hinzufügen

```typescript
export interface LogGroupShortRetentionProps {
  readonly retentionDays?: logs.RetentionDays;
  readonly removalPolicy?: cdk.RemovalPolicy;
}
```

**Ergebnis:** ✅ **GREEN** - Test besteht!

##### 🔧 REFACTOR: JSDoc hinzufügen

```typescript
export interface LogGroupShortRetentionProps {
  /**
   * Retention in Tagen
   * @default logs.RetentionDays.TWO_WEEKS
   */
  readonly retentionDays?: logs.RetentionDays;

  /**
   * RemovalPolicy
   * @default Auto-detect based on stack name
   */
  readonly removalPolicy?: cdk.RemovalPolicy;
}
```

**Ergebnis:** ✅ **Test bleibt grün!**

---

## 🎓 TDD Best Practices für CDK Constructs

### 1. **Starte mit dem einfachsten Test**

❌ **Nicht so:**
```typescript
test('creates complete production-ready log group with encryption, alarms, and cross-region replication', () => {
  // Zu komplex für den Anfang!
});
```

✅ **Besser:**
```typescript
test('creates log group', () => {
  new LogGroupShortRetention(stack, 'Logs');
  const template = Template.fromStack(stack);
  template.resourceCountIs('AWS::Logs::LogGroup', 1);
});
```

### 2. **Ein Test = Eine Assertion**

❌ **Nicht so:**
```typescript
test('creates log group', () => {
  // Zu viele Assertions in einem Test
  template.resourceCountIs('AWS::Logs::LogGroup', 1);
  template.hasResourceProperties('AWS::Logs::LogGroup', { RetentionInDays: 14 });
  template.hasResourceProperties('AWS::Logs::LogGroup', { KmsKeyId: 'xyz' });
  expect(construct.logGroupName).toBeDefined();
});
```

✅ **Besser:**
```typescript
test('creates log group', () => {
  template.resourceCountIs('AWS::Logs::LogGroup', 1);
});

test('sets retention to 14 days', () => {
  template.hasResourceProperties('AWS::Logs::LogGroup', { RetentionInDays: 14 });
});

test('provides log group name output', () => {
  expect(construct.logGroupName).toBeDefined();
});
```

### 3. **Teste Verhalten, nicht Implementierung**

❌ **Nicht so:**
```typescript
test('calls getDefaultRemovalPolicy method', () => {
  // Testet interne Implementierung
  const spy = jest.spyOn(construct, 'getDefaultRemovalPolicy');
  expect(spy).toHaveBeenCalled();
});
```

✅ **Besser:**
```typescript
test('uses DESTROY removal policy for dev stacks', () => {
  // Testet Verhalten/Ergebnis
  const devStack = new Stack(app, 'DevTestStack');
  new LogGroupShortRetention(devStack, 'Logs');
  const template = Template.fromStack(devStack);
  template.hasResource('AWS::Logs::LogGroup', {
    DeletionPolicy: 'Delete',
  });
});
```

### 4. **Arrange-Act-Assert Pattern**

Strukturiere Tests immer in drei Phasen:

```typescript
test('example test', () => {
  // ========================================
  // ARRANGE: Setup
  // ========================================
  const app = new App();
  const stack = new Stack(app, 'TestStack');
  const props = { retentionDays: logs.RetentionDays.ONE_WEEK };

  // ========================================
  // ACT: Ausführen
  // ========================================
  const construct = new LogGroupShortRetention(stack, 'Logs', props);

  // ========================================
  // ASSERT: Überprüfen
  // ========================================
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::Logs::LogGroup', {
    RetentionInDays: 7,
  });
});
```

### 5. **Schreibe aussagekräftige Test-Namen**

❌ **Nicht so:**
```typescript
test('test1', () => { ... });
test('works', () => { ... });
test('log group', () => { ... });
```

✅ **Besser:**
```typescript
test('creates log group with default settings', () => { ... });
test('sets retention to TWO_WEEKS when not specified', () => { ... });
test('uses DESTROY policy for dev stacks', () => { ... });
test('throws error when retention is negative', () => { ... });
```

---

## 🛠️ TDD Workflow Scripts

### Verfügbare NPM Scripts

```bash
# TDD Watch Mode (empfohlen während Entwicklung)
npm run test:tdd
# → Läuft Tests bei jeder Änderung, verbose, ohne Coverage

# Normal Watch Mode
npm run test:watch
# → Läuft Tests bei jeder Änderung, mit Coverage

# Einmalig alle Tests
npm test
# → Läuft alle Tests einmal durch, mit Coverage

# CI Mode
npm run test:ci
# → Für GitHub Actions, non-interactive
```

### Watch Mode Shortcuts

Während `npm run test:tdd` läuft:

- **`a`** - Alle Tests ausführen
- **`f`** - Nur fehlgeschlagene Tests
- **`p`** - Filter by filename pattern
- **`t`** - Filter by test name pattern
- **`q`** - Quit
- **`Enter`** - Trigger test run

---

## 📊 TDD Metriken

### Was ist gute Test Coverage?

```
┌─────────────────────────────────────────┐
│ Metric        │ Minimum │ Empfohlen    │
├─────────────────────────────────────────┤
│ Statements    │ 80%     │ 90%+         │
│ Branches      │ 80%     │ 85%+         │
│ Functions     │ 80%     │ 90%+         │
│ Lines         │ 80%     │ 90%+         │
└─────────────────────────────────────────┘
```

**Achtung:** 100% Coverage ≠ Perfekte Tests!

### Coverage Report ansehen

```bash
npm run test:coverage
open coverage/index.html
```

---

## 🎯 TDD Checkliste für neues Construct

- [ ] **Test-Datei erstellen** (`test/unit.test.ts`)
- [ ] **Watch Mode starten** (`npm run test:tdd`)
- [ ] **Test 1 (RED):** Construct kann instanziiert werden
- [ ] **Implementierung (GREEN):** Minimale Class erstellen
- [ ] **Refactor:** Props-Interface hinzufügen
- [ ] **Test 2 (RED):** Ressource wird erstellt
- [ ] **Implementierung (GREEN):** AWS-Ressource hinzufügen
- [ ] **Refactor:** Defaults und Validierung
- [ ] **Test 3 (RED):** Props funktionieren
- [ ] **Implementierung (GREEN):** Props verarbeiten
- [ ] **Refactor:** JSDoc hinzufügen
- [ ] **Test 4+ (RED):** Weitere Features
- [ ] **Implementierung (GREEN):** Features implementieren
- [ ] **Refactor:** Code optimieren
- [ ] **Coverage Check:** `npm run test:coverage`
- [ ] **Final:** Alle Tests grün, >80% Coverage

---

## 🐛 Häufige TDD-Fehler

### Fehler 1: Test zu komplex

**Problem:**
```typescript
test('creates complete stack with all features', () => {
  // 100 Zeilen Test-Code...
  // 50 Assertions...
});
```

**Lösung:** Teile auf in kleinere Tests
```typescript
test('creates log group', () => { ... });
test('sets retention', () => { ... });
test('adds tags', () => { ... });
```

### Fehler 2: Tests zu spät schreiben

**Problem:**
```typescript
// 500 Zeilen Code geschrieben...
// Jetzt Tests schreiben → Schwierig!
```

**Lösung:** Tests ZUERST! TDD Cycle einhalten.

### Fehler 3: Tests nicht laufen lassen

**Problem:**
```typescript
// Tests geschrieben, aber nie ausgeführt
// Code committed → Tests sind rot in CI 😱
```

**Lösung:** Watch Mode verwenden, Tests ständig im Blick.

### Fehler 4: Code für Tests anpassen

**Problem:**
```typescript
// Private Methode public machen nur für Tests
public getDefaultRemovalPolicy() { ... }
```

**Lösung:** Teste Verhalten, nicht Implementierung.

---

## 🚀 TDD für verschiedene Construct-Typen

### Primitives (einfache Ressourcen)

**Beispiel:** S3 Bucket, Log Group, KMS Key

**Typische Tests:**
1. Ressource wird erstellt
2. Security Defaults sind gesetzt
3. Props funktionieren
4. Outputs sind verfügbar
5. Validierung funktioniert

### Patterns (mehrere Ressourcen)

**Beispiel:** API + Lambda, Queue + Worker

**Typische Tests:**
1. Alle Ressourcen werden erstellt
2. Ressourcen sind korrekt verbunden (IAM Policies, etc.)
3. Dependencies zwischen Ressourcen
4. Optionale Features funktionieren
5. Integration zwischen Komponenten

---

## 📚 Weiterführende Ressourcen

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [CDK Testing Best Practices](https://docs.aws.amazon.com/cdk/v2/guide/testing.html)
- [TDD by Example (Kent Beck)](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
- [Growing Object-Oriented Software, Guided by Tests](https://www.amazon.com/Growing-Object-Oriented-Software-Guided-Tests/dp/0321503627)

---

## ✅ Zusammenfassung

**TDD für CDK Constructs in 3 Schritten:**

1. **🔴 RED:** Schreibe Test der fehlschlägt
2. **🟢 GREEN:** Schreibe minimalen Code um Test zu bestehen
3. **🔧 REFACTOR:** Verbessere Code, Tests bleiben grün

**Vorteile:**
- ✅ Weniger Bugs
- ✅ Besseres Design
- ✅ Lebende Dokumentation
- ✅ Refactoring ohne Angst
- ✅ Schnelleres Feedback

**Workflow:**
```bash
npm run test:tdd
# → Schreibe Test (rot) → Implementiere (grün) → Refactor → Repeat
```

---

**Viel Erfolg mit TDD! 🚀**

Bei Fragen: Siehe [CONTRIBUTING.md](./CONTRIBUTING.md) oder [GETTING_STARTED.md](./GETTING_STARTED.md)

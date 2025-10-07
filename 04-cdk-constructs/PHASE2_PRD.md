# PRD: Phase 2 – CDK Constructs Implementation & Testing

**Projekt:** aws-portfolio-setup/04-cdk-constructs  
**Phase:** 2 von 3  
**Erstellt:** 2025-01-07  
**Status:** 🔸 Bereit zum Start  
**Priorität:** Hoch  
**Geschätzter Aufwand:** 2-3 Wochen

---

## 📋 Executive Summary

**Kontext:** Phase 1 ist abgeschlossen. Die CDK-Constructs-Library hat jetzt eine saubere Domain-Architektur (primitives/ + patterns/), erweiterte READMEs mit Versionierung/Kosten/Beispielen, ein Template-System und eine CONTRIBUTING.md.

**Problem:** Die Constructs sind dokumentiert, aber **nicht implementiert**. Es gibt nur READMEs, aber keinen funktionierenden TypeScript-Code. Außerdem fehlen Tests und vollständige Beispiele.

**Ziel Phase 2:** Alle existierenden Constructs (13 Stück) **vollständig implementieren** mit:
- ✅ Funktionierendem TypeScript-Code (src/index.ts)
- ✅ Unit-Tests (test/unit.test.ts)
- ✅ Mindestens 1 Beispiel (examples/basic.ts)
- ✅ CHANGELOG.md aktualisiert
- ✅ README validiert/korrigiert

**Erfolgsmetrik:** Alle 13 Constructs können per `cdk synth` erfolgreich kompiliert werden und haben mindestens 1 passing Test.

---

## 🎯 Was ist bereits vorhanden? (Phase 1 Deliverables)

### ✅ Struktur (komplett)

```
04-cdk-constructs/
├── primitives/
│   ├── storage/s3-bucket-secure/           ← README ✅, CHANGELOG ✅, examples/ ✅, src/ 🔸, test/ 🔸
│   ├── security/iam-role-lambda-basic/     ← README ✅
│   ├── security/kms-key-managed/           ← README ✅
│   ├── messaging/sqs-queue-encrypted/      ← README ✅
│   ├── messaging/sns-topic-encrypted/      ← README ✅
│   ├── observability/log-group-short-retention/ ← README ✅
│   └── networking/network-baseline/        ← README ✅
├── patterns/
│   ├── api/http-api-lambda/                ← README ✅
│   ├── async/queue-worker/                 ← README ✅
│   ├── web/static-site-cloudfront/         ← README ✅
│   ├── data/dynamodb-table-streams/        ← README ✅
│   ├── data/s3-bucket-lifecycle/           ← README ✅
│   └── governance/budget-alerts/           ← README ✅
├── .construct-template/
│   └── README.template.md                  ← Template ✅
├── CONTRIBUTING.md                          ← Anleitung ✅
├── PHASE1_MIGRATION.md                      ← Dokumentation ✅
└── README.md                                ← Haupt-README ✅
```

### ✅ Dokumentation (vollständig)

Jedes Construct hat:
- ✅ README.md mit Status (🟢/🟡/🔴), Version, Kosten, Dependencies, Beispiele
- ✅ Ordner-Struktur (src/, test/, examples/)
- 🔸 CHANGELOG.md (nur s3-bucket-secure hat eines, Rest fehlt)
- 🔸 Kein Code in src/ (leer)
- 🔸 Keine Tests in test/ (leer)
- 🔸 Keine funktionierenden Beispiele in examples/ (nur s3-bucket-secure hat basic.ts)

### ✅ Standards definiert

- ✅ Semantic Versioning
- ✅ README-Template
- ✅ CONTRIBUTING.md mit Checkliste
- ✅ Code-Standards (TypeScript strict, Props, Outputs)
- ✅ Test-Standards (CDK Assertions, Snapshot-Tests)

---

## 🎯 Was fehlt? (Phase 2 Scope)

### 🔴 Kritisch (Must-Have)

1. **TypeScript-Implementierung** (src/index.ts) für alle 13 Constructs
   - Props-Interface definieren
   - Construct-Klasse implementieren
   - Outputs als public properties
   - Defaults setzen (Security, Cost-Optimization)

2. **Unit-Tests** (test/unit.test.ts) für alle 13 Constructs
   - Mindestens 1 Test: "Construct creates expected resources"
   - CDK Template Assertions
   - Props-Validierung (optional)

3. **Funktionierendes Beispiel** (examples/basic.ts) für alle 13 Constructs
   - Copy-Paste-fähig
   - Kompiliert mit `cdk synth`

4. **CHANGELOG.md** für alle Constructs (aktuell nur s3-bucket-secure)

### 🟡 Wichtig (Should-Have)

5. **Production-Beispiel** (examples/production.ts) für Top-5 Constructs
   - Mit Alarms, Logging, Monitoring
   - Best-Practice-Konfiguration

6. **Integration-Tests** (optional, nur für kritische Constructs)
   - Echter Deploy in Test-Account
   - Cleanup nach Test

7. **package.json** pro Construct (für späteres NPM-Publishing)

### 🔵 Nice-to-Have (Could-Have, Phase 3)

8. **Blueprints** (vollständige Starter-Stacks)
9. **Catalog-System** (.catalog/index.json)
10. **CI/CD** für automatische Tests

---

## 📦 Detaillierter Scope: Alle 13 Constructs

### **Primitives (7 Constructs)**

#### 1. primitives/storage/s3-bucket-secure
**Status:** 🟡 Teilweise fertig (README ✅, CHANGELOG ✅, examples/basic.ts ✅)  
**Fehlend:**
- [ ] src/index.ts (TypeScript-Code)
- [ ] test/unit.test.ts
- [ ] examples/production.ts

**Props:**
```ts
interface S3BucketSecureProps {
  versioned?: boolean;              // Default: false
  serverAccessLogs?: boolean;       // Default: false
  removalPolicy?: RemovalPolicy;    // Default: RETAIN
}
```

**Outputs:**
```ts
public readonly bucketName: string;
public readonly bucketArn: string;
public readonly logsBucketName?: string;
```

**Tests:**
- ✅ Bucket hat Block Public Access (alle 4 Flags)
- ✅ Bucket hat SSE-S3 Verschlüsselung
- ✅ Bucket hat HTTPS-only Policy

---

#### 2. primitives/security/iam-role-lambda-basic
**Status:** 🔴 README-only  
**Fehlend:**
- [ ] src/index.ts
- [ ] test/unit.test.ts
- [ ] examples/basic.ts
- [ ] examples/production.ts (mit X-Ray)
- [ ] CHANGELOG.md

**Props:**
```ts
interface IamRoleLambdaBasicProps {
  enableXray?: boolean;             // Default: false
  extraPolicies?: PolicyStatement[]; // Default: []
}
```

**Outputs:**
```ts
public readonly roleArn: string;
public readonly role: iam.Role;
```

**Tests:**
- ✅ Role hat AssumeRole Policy für lambda.amazonaws.com
- ✅ Role hat logs:CreateLogGroup/Stream/PutLogEvents
- ✅ Optional: X-Ray WriteOnly Permissions

---

#### 3. primitives/security/kms-key-managed
**Status:** 🔴 README-only  
**Fehlend:** Alles (src/, test/, examples/, CHANGELOG.md)

**Props:**
```ts
interface KmsKeyManagedProps {
  enableRotation?: boolean;         // Default: true
  alias?: string;                   // Default: undefined
  policyAdditions?: PolicyStatement[]; // Default: []
}
```

**Outputs:**
```ts
public readonly keyArn: string;
public readonly keyId: string;
public readonly key: kms.Key;
```

---

#### 4. primitives/messaging/sqs-queue-encrypted
**Status:** 🔴 README-only  
**Fehlend:** Alles

**Props:**
```ts
interface SqsQueueEncryptedProps {
  visibilityTimeout?: number;       // Default: 30 (Sekunden)
  withDlq?: boolean;                // Default: true
  kmsKeyArn?: string;               // Default: undefined (AWS-managed)
}
```

**Outputs:**
```ts
public readonly queueUrl: string;
public readonly queueArn: string;
public readonly dlqUrl?: string;
```

---

#### 5. primitives/messaging/sns-topic-encrypted
**Status:** 🔴 README-only  
**Fehlend:** Alles

**Props:**
```ts
interface SnsTopicEncryptedProps {
  kmsKeyArn?: string;               // Default: undefined
  displayName?: string;             // Default: undefined
}
```

**Outputs:**
```ts
public readonly topicArn: string;
public readonly topic: sns.Topic;
```

---

#### 6. primitives/observability/log-group-short-retention
**Status:** 🔴 README-only  
**Fehlend:** Alles

**Props:**
```ts
interface LogGroupShortRetentionProps {
  retentionDays?: RetentionDays;    // Default: 14
  kmsKeyArn?: string;               // Default: undefined
  logGroupName?: string;            // Default: auto-generated
}
```

**Outputs:**
```ts
public readonly logGroupName: string;
public readonly logGroupArn: string;
```

---

#### 7. primitives/networking/network-baseline
**Status:** 🔴 README-only  
**Fehlend:** Alles

**Props:**
```ts
interface NetworkBaselineProps {
  createNatGateways?: number;       // Default: 0 (NAT-free)
  addGatewayEndpoints?: ('s3' | 'dynamodb')[]; // Default: []
  existingVpc?: ec2.IVpc;           // Default: undefined (create new)
}
```

**Outputs:**
```ts
public readonly vpcId: string;
public readonly vpc: ec2.Vpc;
public readonly publicSubnetIds: string[];
public readonly privateSubnetIds: string[];
```

---

### **Patterns (6 Constructs)**

#### 8. patterns/api/http-api-lambda
**Status:** 🔴 README-only  
**Fehlend:** Alles

**Props:**
```ts
interface Route {
  path: string;                     // z.B. "/health"
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: string;                  // z.B. "src/handlers/health.handler"
}

interface HttpApiLambdaProps {
  routes: Route[];                  // Required
  environment?: { [key: string]: string }; // Default: {}
  reservedConcurrency?: number;     // Default: undefined
  alarms?: {
    latencyP99?: boolean;           // Default: false
    errorRate?: boolean;            // Default: false
  };
}
```

**Outputs:**
```ts
public readonly apiUrl: string;
public readonly functionArn: string;
```

**Dependencies (intern):**
- Nutzt: `primitives/security/iam-role-lambda-basic`
- Nutzt: `primitives/observability/log-group-short-retention`

---

#### 9. patterns/async/queue-worker
**Status:** 🔴 README-only  
**Fehlend:** Alles

**Props:**
```ts
interface QueueWorkerProps {
  visibilityTimeout: number;        // Required (Sekunden)
  batchSize?: number;               // Default: 1
  encryption?: boolean;             // Default: true
  handler: string;                  // Required, z.B. "src/handlers/worker.handler"
}
```

**Outputs:**
```ts
public readonly queueUrl: string;
public readonly dlqUrl: string;
public readonly functionArn: string;
```

**Dependencies (intern):**
- Nutzt: `primitives/messaging/sqs-queue-encrypted`
- Nutzt: `primitives/security/iam-role-lambda-basic`

---

#### 10. patterns/web/static-site-cloudfront
**Status:** 🔴 README-only  
**Fehlend:** Alles

**Props:**
```ts
interface StaticSiteCloudFrontProps {
  domainName?: string;              // Optional
  aliases?: string[];               // Default: []
  certificateArn?: string;          // Required if aliases set
  loggingBucket?: s3.IBucket;       // Optional
  enableWaf?: boolean;              // Default: false
}
```

**Outputs:**
```ts
public readonly distributionDomainName: string;
public readonly bucketName: string;
```

**Dependencies (intern):**
- Nutzt: `primitives/storage/s3-bucket-secure`

---

#### 11. patterns/data/dynamodb-table-streams
**Status:** 🔴 README-only  
**Fehlend:** Alles

**Props:**
```ts
interface DynamoTableStreamsProps {
  partitionKey: { name: string; type: 'STRING' | 'NUMBER' };
  sortKey?: { name: string; type: 'STRING' | 'NUMBER' };
  billingMode: 'PAY_PER_REQUEST' | 'PROVISIONED';
  gsis?: GlobalSecondaryIndex[];   // Optional
  streamConsumer?: { handler: string }; // Optional
}
```

**Outputs:**
```ts
public readonly tableName: string;
public readonly streamArn?: string;
```

---

#### 12. patterns/data/s3-bucket-lifecycle
**Status:** 🔴 README-only  
**Fehlend:** Alles

**Props:**
```ts
interface S3BucketLifecycleProps {
  versioned?: boolean;              // Default: false
  lifecycle?: {
    toIAAfterDays?: number;         // Default: 30
    toGlacierAfterDays?: number;    // Default: 90
    deleteIncompleteUploadsAfterDays?: number; // Default: 7
  };
  serverAccessLogsBucket?: s3.IBucket; // Optional
}
```

**Outputs:**
```ts
public readonly bucketName: string;
public readonly logsBucketName?: string;
```

**Dependencies (intern):**
- Erweitert: `primitives/storage/s3-bucket-secure`

---

#### 13. patterns/governance/budget-alerts
**Status:** 🔴 README-only  
**Fehlend:** Alles

**Props:**
```ts
interface BudgetAlertsProps {
  limitUsd: number;                 // Required
  emails: string[];                 // Required
  thresholds?: number[];            // Default: [50, 80, 100]
}
```

**Outputs:**
```ts
public readonly budgetName: string;
public readonly topicArn: string;
```

**Dependencies (intern):**
- Nutzt: `primitives/messaging/sns-topic-encrypted`

---

## 🛠️ Implementation Plan (Reihenfolge)

### **Iteration 1: Primitives (Woche 1)**

**Reihenfolge (Bottom-Up, Dependencies first):**

1. **primitives/observability/log-group-short-retention** (keine Dependencies)
2. **primitives/security/kms-key-managed** (keine Dependencies)
3. **primitives/security/iam-role-lambda-basic** (keine Dependencies)
4. **primitives/messaging/sns-topic-encrypted** (kann KMS nutzen)
5. **primitives/messaging/sqs-queue-encrypted** (kann KMS nutzen)
6. **primitives/storage/s3-bucket-secure** (teilweise fertig)
7. **primitives/networking/network-baseline** (keine Dependencies)

**Deliverables pro Construct:**
- ✅ src/index.ts (funktionsfähig)
- ✅ test/unit.test.ts (mindestens 1 Test)
- ✅ examples/basic.ts (funktionsfähig)
- ✅ CHANGELOG.md (v1.0.0)

---

### **Iteration 2: Patterns (Woche 2)**

**Reihenfolge (Dependencies first):**

1. **patterns/async/queue-worker** (nutzt SQS + IAM + Logs)
2. **patterns/api/http-api-lambda** (nutzt IAM + Logs)
3. **patterns/data/s3-bucket-lifecycle** (erweitert S3)
4. **patterns/data/dynamodb-table-streams** (nutzt IAM + Logs optional)
5. **patterns/governance/budget-alerts** (nutzt SNS)
6. **patterns/web/static-site-cloudfront** (nutzt S3)

**Deliverables pro Construct:**
- ✅ src/index.ts
- ✅ test/unit.test.ts
- ✅ examples/basic.ts
- ✅ examples/production.ts (für Top 3: http-api-lambda, queue-worker, static-site-cloudfront)
- ✅ CHANGELOG.md

---

### **Iteration 3: Validation & Refinement (Woche 3)**

1. **Alle Tests laufen durch** (`npm test` in jedem Construct)
2. **Alle Beispiele kompilieren** (`cdk synth` in examples/)
3. **READMEs validieren** (Kosten korrekt? Dependencies aktuell?)
4. **package.json** hinzufügen (vorbereiten für NPM-Publishing in Phase 3)

---

## ✅ Definition of Done (pro Construct)

Ein Construct ist "fertig" wenn:

- [ ] **src/index.ts** existiert und kompiliert ohne Fehler
- [ ] **test/unit.test.ts** existiert mit mindestens 1 passing Test
- [ ] **examples/basic.ts** existiert und `cdk synth` funktioniert
- [ ] **CHANGELOG.md** existiert mit v1.0.0 Entry
- [ ] **README.md** ist validiert (Props/Outputs stimmen mit Code überein)
- [ ] **Status-Badge** im README ist korrekt (🟢 Stable nach Tests)
- [ ] Kein `TODO` oder `FIXME` im Code

---

## 🧪 Test-Standards (Reminder)

### Unit-Test Template:
```ts
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MyConstruct } from '../src';

describe('MyConstruct', () => {
  test('creates expected resources', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    
    new MyConstruct(stack, 'Test', { /* minimal props */ });
    
    const template = Template.fromStack(stack);
    
    // Assertions
    template.resourceCountIs('AWS::ServiceName::Resource', 1);
    template.hasResourceProperties('AWS::ServiceName::Resource', {
      PropertyName: 'ExpectedValue'
    });
  });
});
```

### Test-Befehle:
```bash
# In jedem Construct-Ordner
npm install
npm test

# Oder global
cd 04-cdk-constructs
for dir in primitives/*/* patterns/*/*; do
  cd $dir && npm test && cd -
done
```

---

## 📦 Dependencies (NPM-Packages)

Jedes Construct braucht:

```json
{
  "name": "@aws-constructs/{category}-{name}",
  "version": "1.0.0",
  "peerDependencies": {
    "aws-cdk-lib": "^2.120.0",
    "constructs": "^10.0.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^5.0.0",
    "aws-cdk-lib": "^2.120.0",
    "constructs": "^10.0.0"
  }
}
```

---

## 🎯 Success Criteria (Phase 2 Complete)

### Quantitativ:
- ✅ 13/13 Constructs haben funktionierenden Code (src/)
- ✅ 13/13 Constructs haben mindestens 1 passing Test
- ✅ 13/13 Constructs haben CHANGELOG.md
- ✅ 13/13 Constructs haben examples/basic.ts
- ✅ 6/13 Patterns haben examples/production.ts (Top 6)

### Qualitativ:
- ✅ Alle Tests laufen durch (`npm test`)
- ✅ Alle Beispiele kompilieren (`cdk synth`)
- ✅ READMEs stimmen mit Code überein
- ✅ Keine Security-Warnings (cdk-nag optional)
- ✅ Code-Quality: TypeScript strict, ESLint clean

### Dokumentation:
- ✅ Phase 2 abgeschlossen in PHASE2_COMPLETION.md dokumentiert
- ✅ README.md aktualisiert (Status: Production-Ready)

---

## 🚨 Risiken & Mitigation

### Risiko 1: Zu viel Scope
**Problem:** 13 Constructs in 2-3 Wochen ist ambitioniert.  
**Mitigation:** 
- Priorisierung: Primitives zuerst (simpler)
- MVP-Approach: Nur basic.ts, production.ts später
- Parallele Arbeit möglich (Constructs unabhängig)

### Risiko 2: Dependencies zwischen Constructs
**Problem:** Pattern X nutzt Primitive Y, aber Y ist noch nicht fertig.  
**Mitigation:**
- Bottom-Up Implementation (siehe Iteration Plan)
- Primitives in Woche 1, Patterns in Woche 2

### Risiko 3: Testing-Komplexität
**Problem:** CDK-Tests können komplex sein.  
**Mitigation:**
- Template-Tests verwenden (einfacher als Integration-Tests)
- Snapshot-Tests für Regressions-Schutz
- Nur kritische Assertions (nicht jede Property testen)

---

## 📚 Resources & References

### CDK Testing:
- [CDK Assertions Docs](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.assertions-readme.html)
- [CDK Testing Best Practices](https://docs.aws.amazon.com/cdk/v2/guide/testing.html)

### Code-Beispiele:
- AWS Solutions Constructs: https://github.com/awslabs/aws-solutions-constructs
- CDK Patterns: https://cdkpatterns.com/

### Intern:
- CONTRIBUTING.md (Standards)
- .construct-template/ (Template)
- primitives/storage/s3-bucket-secure/ (Beispiel-Construct)

---

## 🎯 Next Steps (Sofort starten)

### Schritt 1: Setup (5 Minuten)
```bash
cd 04-cdk-constructs/primitives/observability/log-group-short-retention
npm init -y
npm install --save-dev aws-cdk-lib constructs typescript @types/node
mkdir -p src test examples
```

### Schritt 2: Erstes Construct (30 Minuten)
- src/index.ts schreiben (LogGroupShortRetention)
- test/unit.test.ts schreiben (1 Test)
- examples/basic.ts schreiben
- `npm test` und `cdk synth` validieren

### Schritt 3: CHANGELOG.md + README validieren (10 Minuten)
- CHANGELOG.md erstellen (v1.0.0)
- README Props/Outputs mit Code abgleichen
- Status auf 🟢 Stable setzen

### Schritt 4: Wiederholen für nächstes Construct
- Iteration: 7 Primitives, dann 6 Patterns
- Nach jedem Construct: Commit + Push

---

## ✅ Phase 2 Checklist (High-Level)

- [ ] **Iteration 1:** Alle 7 Primitives implementiert + getestet
- [ ] **Iteration 2:** Alle 6 Patterns implementiert + getestet
- [ ] **Iteration 3:** Alle Tests passing, alle Beispiele funktionieren
- [ ] **Documentation:** PHASE2_COMPLETION.md geschrieben
- [ ] **Validation:** Stichproben-Deploy in Test-Account (optional)
- [ ] **README Update:** Haupt-README auf "Phase 2 Complete" setzen

---

**Status nach Phase 2:** Production-Ready CDK Constructs Library mit funktionierendem Code, Tests und Beispielen. Bereit für echte Projekte! 🚀

**Nächste Phase (Phase 3, optional):** Blueprints, Catalog-System, NPM-Publishing, CI/CD

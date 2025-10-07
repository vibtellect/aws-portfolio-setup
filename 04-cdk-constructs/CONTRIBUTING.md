# Contributing Guide: Neue Constructs erstellen

## Quick Start: Neues Construct erstellen

### 1. Kategorie wählen
- **primitives/** → Einzelne AWS-Ressource mit Defaults (z. B. S3 Bucket, Lambda Function)
- **patterns/** → Kombination mehrerer Ressourcen (z. B. API + Lambda, Queue + Worker)

### 2. Domain wählen
```
primitives/
├── compute/       # Lambda, Fargate, EC2
├── storage/       # S3, EBS, EFS
├── database/      # DynamoDB, RDS
├── networking/    # VPC, Subnets, Endpoints
├── security/      # IAM, KMS, Secrets
├── messaging/     # SQS, SNS, EventBridge
├── observability/ # CloudWatch, X-Ray
└── cdn/           # CloudFront, Route 53

patterns/
├── api/           # REST, HTTP, GraphQL APIs
├── async/         # Queues, Events, Workflows
├── web/           # Static Sites, SPAs
├── data/          # Data Pipelines, Lakes
├── container/     # ECS, EKS
└── governance/    # Budgets, Compliance
```

### 3. Ordnerstruktur anlegen
```bash
cd 04-cdk-constructs/{category}/{domain}/

mkdir my-construct
cd my-construct

# Template kopieren
cp ../../../.construct-template/README.template.md README.md

# Ordner erstellen
mkdir -p src test examples
```

### 4. Dateien erstellen
```
my-construct/
├── README.md           # Aus Template, anpassen
├── CHANGELOG.md        # Versionshistorie
├── src/
│   └── index.ts        # Implementierung
├── test/
│   └── unit.test.ts    # CDK Tests
└── examples/
    ├── basic.ts        # Minimal-Beispiel
    └── production.ts   # Vollständiges Beispiel
```

## Standards

### README.md (Pflichtfelder)
- Status-Badge (🟢 Stable | 🟡 Beta | 🔴 Experimental)
- Version (v1.0.0)
- Zweck (1 Zeile)
- Wann verwenden (✅/❌)
- Quick Start (Copy-Paste Code)
- Kosten (Free Tier, Typisch, Kostenfallen)
- Dependencies (intern)
- Beispiele (Minimal + Production)

### CHANGELOG.md Format
```markdown
# Changelog

## [1.0.0] - 2025-01-07
### Added
- Initial release
- Feature X

### Changed
- Improved Y

### Fixed
- Bug Z
```

### Code-Standards
- TypeScript strict mode
- Props mit klaren Defaults
- Outputs mit sprechenden Namen
- Sicherheit by default (Encryption, Least Privilege)
- Kostenarm (kurze Retentions, NAT-free wo möglich)

### Test-Standards
```ts
// test/unit.test.ts
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MyConstruct } from '../src';

test('MyConstruct creates expected resources', () => {
  const app = new App();
  const stack = new Stack(app, 'TestStack');
  
  new MyConstruct(stack, 'Test', { /* props */ });
  
  const template = Template.fromStack(stack);
  
  // Assertions
  template.resourceCountIs('AWS::Lambda::Function', 1);
  template.hasResourceProperties('AWS::Lambda::Function', {
    Runtime: 'nodejs18.x'
  });
});
```

## Beispiel-Struktur: Vollständiges Construct

```
primitives/compute/lambda-function-secure/
├── README.md
├── CHANGELOG.md
├── src/
│   └── index.ts
├── test/
│   └── unit.test.ts
└── examples/
    ├── basic.ts
    └── production.ts
```

**README.md:**
```markdown
# lambda-function-secure

> **Status:** 🟢 Stable  
> **Version:** v1.0.0 | **Last Updated:** 2025-01-07

## Zweck
- Lambda Function mit sicheren Defaults (IAM Least Privilege, Logs, X-Ray optional)

## Wann verwenden
- ✅ Standard Lambda-Funktionen mit minimaler Konfiguration
- ✅ Serverless APIs, Event-Handler
- ❌ NICHT verwenden für: Container-basierte Workloads (nutze Fargate)

...
```

**CHANGELOG.md:**
```markdown
# Changelog

## [1.0.0] - 2025-01-07
### Added
- Initial release
- IAM Role mit Logs-Berechtigung
- Optionales X-Ray Tracing
- CloudWatch Logs mit 14-Tage Retention
```

## Versioning (Semantic Versioning)

- **v1.0.0** → Stable, Breaking Changes
- **v1.1.0** → Neue Features (backward-compatible)
- **v1.0.1** → Bugfixes

### Breaking Changes kommunizieren
```markdown
## [2.0.0] - 2025-02-01
### BREAKING CHANGES
- ⚠️ `oldProp` umbenannt zu `newProp`
- ⚠️ Default-Runtime von `nodejs16.x` zu `nodejs18.x`

### Migration Guide
```ts
// Alt
new MyConstruct(this, 'X', { oldProp: 'value' });

// Neu
new MyConstruct(this, 'X', { newProp: 'value' });
```
```

## Checkliste vor Commit

- [ ] README.md vollständig ausgefüllt
- [ ] CHANGELOG.md aktualisiert
- [ ] Status-Badge gesetzt (🟢/🟡/🔴)
- [ ] Version aktualisiert
- [ ] Kosten-Abschnitt ausgefüllt
- [ ] Mindestens 1 Beispiel (examples/basic.ts)
- [ ] Test geschrieben (test/unit.test.ts)
- [ ] Dependencies dokumentiert
- [ ] Code funktioniert (cdk synth erfolgreich)

---

**Bei Fragen:** GitHub Issues oder @maintainer kontaktieren

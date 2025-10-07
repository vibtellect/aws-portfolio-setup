# Setup Guide: Neues Construct erstellen

Diese Anleitung führt dich Schritt für Schritt durch den Prozess, ein neues Construct zu erstellen.

## 📋 Voraussetzungen

- [ ] Node.js 18+ installiert
- [ ] AWS CDK CLI installiert (`npm install -g aws-cdk`)
- [ ] Git installiert
- [ ] Vertrautheit mit TypeScript und AWS CDK

## 🚀 Schritt-für-Schritt Anleitung

### Schritt 1: Kategorie & Domain wählen

Entscheide zuerst, wo dein Construct hingehört:

**Kategorie wählen:**
- `primitives/` – Einzelne AWS-Ressource (z.B. S3 Bucket, Lambda Function)
- `patterns/` – Kombination mehrerer Ressourcen (z.B. API + Lambda)

**Domain wählen:**

Für **primitives:**
- `compute/` – Lambda, Fargate, EC2
- `storage/` – S3, EBS, EFS
- `database/` – DynamoDB, RDS, Aurora
- `networking/` – VPC, Subnets, Endpoints
- `security/` – IAM, KMS, Secrets Manager
- `messaging/` – SQS, SNS, EventBridge
- `observability/` – CloudWatch, X-Ray
- `cdn/` – CloudFront, Route 53

Für **patterns:**
- `api/` – REST, HTTP, GraphQL APIs
- `async/` – Queues, Events, Workflows
- `web/` – Static Sites, SPAs
- `data/` – Data Pipelines, Lakes
- `container/` – ECS, EKS, Fargate
- `governance/` – Budgets, Compliance, Policies

### Schritt 2: Ordnerstruktur erstellen

```bash
# Navigiere zum gewählten Domain-Ordner
cd 04-cdk-constructs/{category}/{domain}/

# Erstelle neuen Construct-Ordner
mkdir my-construct-name
cd my-construct-name

# Erstelle Unterordner
mkdir -p src test examples
```

### Schritt 3: Template-Dateien kopieren

```bash
# Gehe zum Template-Verzeichnis
cd /path/to/04-cdk-constructs/.construct-template

# Kopiere alle Template-Dateien in dein neues Construct-Verzeichnis
cp README.template.md ../path/to/my-construct-name/README.md
cp CHANGELOG.template.md ../path/to/my-construct-name/CHANGELOG.md
cp package.template.json ../path/to/my-construct-name/package.json
cp tsconfig.template.json ../path/to/my-construct-name/tsconfig.json
cp jest.config.template.js ../path/to/my-construct-name/jest.config.js
cp src/index.template.ts ../path/to/my-construct-name/src/index.ts
cp test/unit.test.template.ts ../path/to/my-construct-name/test/unit.test.ts
cp examples/basic.template.ts ../path/to/my-construct-name/examples/basic.ts
cp examples/production.template.ts ../path/to/my-construct-name/examples/production.ts
```

### Schritt 4: Platzhalter ersetzen

Ersetze in **allen** kopierten Dateien die folgenden Platzhalter:

| Platzhalter | Ersetzen durch | Beispiel |
|-------------|----------------|----------|
| `{construct-name}` | Dein Construct-Name (kebab-case) | `lambda-function-secure` |
| `{ConstructName}` | Dein Construct-Name (PascalCase) | `LambdaFunctionSecure` |
| `{category}` | Kategorie | `primitives` oder `patterns` |
| `{domain}` | Domain | `compute`, `api`, etc. |
| `{YYYY-MM-DD}` | Aktuelles Datum | `2025-01-07` |
| `{outputProperty1}` | Name deiner Output-Property | `functionArn` |
| `{outputProperty2}` | Name deiner zweiten Output | `functionUrl` |
| `{ResourceType}` | AWS CDK Resource Type | `lambda.Function` |
| `{resourceReference}` | Name der Resource-Referenz | `lambdaFunction` |

**Tipp:** Verwende Search & Replace in deinem Editor (z.B. VS Code: Cmd/Ctrl + Shift + H)

### Schritt 5: README.md ausfüllen

Gehe durch das README.md und fülle alle Abschnitte aus:

- [ ] **Zweck** – Eine präzise Zeile
- [ ] **Wann verwenden** – 3-4 Use-Cases mit ✅/❌
- [ ] **Voraussetzungen** – Dependencies auflisten
- [ ] **Quick Start** – Funktionierendes Code-Beispiel
- [ ] **Props** – Alle erforderlichen und optionalen Props
- [ ] **Outputs** – Alle öffentlichen Properties
- [ ] **Kosten** – Free Tier, Typische Kosten, Kostenfallen
- [ ] **Beispiele** – Minimal & Production Code
- [ ] **Dependencies** – Interne Construct-Dependencies
- [ ] **Sicherheit** – Security Features dokumentieren
- [ ] **Architektur** – Welche AWS-Ressourcen werden erstellt?
- [ ] **Limitationen** – Bekannte Einschränkungen
- [ ] **Related Constructs** – Alternativen und Ergänzungen

### Schritt 6: Source Code implementieren (src/index.ts)

Implementiere dein Construct:

```typescript
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
// Import AWS Services (z.B. import * as s3 from 'aws-cdk-lib/aws-s3';)

export interface MyConstructProps {
  // Definiere deine Props
  readonly requiredProp: string;
  readonly optionalProp?: boolean;
}

export class MyConstruct extends Construct {
  // Definiere deine Outputs
  public readonly outputProperty: string;

  constructor(scope: Construct, id: string, props: MyConstructProps) {
    super(scope, id);

    // Validierung
    this.validateProps(props);

    // AWS-Ressourcen erstellen
    // const bucket = new s3.Bucket(this, 'Bucket', { ... });

    // Outputs setzen
    // this.outputProperty = bucket.bucketArn;
  }

  private validateProps(props: MyConstructProps): void {
    // Validierungs-Logik
  }
}
```

**Wichtig:**
- [ ] Folge TypeScript strict mode
- [ ] Verwende `readonly` für Props
- [ ] Implementiere Props-Validierung
- [ ] Setze sichere Defaults (Encryption, Least Privilege)
- [ ] Nutze RemovalPolicy intelligent (RETAIN für Prod, DESTROY für Dev)
- [ ] Füge aussagekräftige Tags hinzu

### Schritt 7: Unit Tests schreiben (test/unit.test.ts)

Schreibe mindestens diese Tests:

```typescript
import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { MyConstruct } from '../src';

describe('MyConstruct', () => {
  test('creates expected resources', () => {
    const app = new App();
    const stack = new Stack(app, 'TestStack');
    
    new MyConstruct(stack, 'Test', {
      requiredProp: 'test-value',
    });
    
    const template = Template.fromStack(stack);
    
    // Assertions
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
      // Erwartete Properties
    });
  });
});
```

**Empfohlene Test-Coverage:**
- [ ] Basic functionality test
- [ ] Props validation test
- [ ] Security features test
- [ ] Optional props test
- [ ] Snapshot test

### Schritt 8: Beispiele implementieren

**basic.ts:**
- Minimale Konfiguration
- Alle Defaults verwenden
- 1 CfnOutput

**production.ts:**
- Vollständige Konfiguration
- Alle Security-Features aktiviert
- Monitoring & Alarme
- Mehrere Outputs
- Tags & RemovalPolicy

### Schritt 9: Dependencies installieren & Testen

```bash
# In deinem Construct-Verzeichnis
npm install

# TypeScript kompilieren
npm run build

# Tests ausführen
npm test

# CDK Synth testen
cd examples
cdk synth -a "npx ts-node basic.ts"
```

**Alle Tests müssen bestehen!**

### Schritt 10: CHANGELOG.md erstellen

Erstelle einen Initial Release Entry:

```markdown
# Changelog

## [1.0.0] - 2025-01-07

### Added
- 🎉 Initial release
- ✨ Feature X
- 🔒 Security Feature Y
- 📝 Vollständige Dokumentation

### Security
- Encryption at Rest aktiviert
- IAM Least Privilege
```

### Schritt 11: Validierung & Checklist

Prüfe diese Punkte bevor du committest:

- [ ] **README.md** ist vollständig ausgefüllt
- [ ] **CHANGELOG.md** hat v1.0.0 Entry
- [ ] **Status-Badge** ist gesetzt (🟢/🟡/🔴)
- [ ] **Props** sind korrekt dokumentiert und implementiert
- [ ] **Outputs** sind dokumentiert und funktionieren
- [ ] **Kosten-Abschnitt** ist ausgefüllt
- [ ] **src/index.ts** kompiliert ohne Fehler
- [ ] **test/unit.test.ts** alle Tests bestehen
- [ ] **examples/basic.ts** funktioniert (`cdk synth`)
- [ ] **examples/production.ts** funktioniert
- [ ] **Dependencies** sind dokumentiert
- [ ] **Security** ist dokumentiert
- [ ] Code folgt TypeScript strict mode
- [ ] Keine TODOs oder FIXMEs im Code

### Schritt 12: Git Commit

```bash
# Füge alle Dateien hinzu
git add .

# Commit mit aussagekräftiger Message
git commit -m "feat({category}/{domain}): add {construct-name} v1.0.0

- Initial implementation
- Full documentation
- Unit tests
- Basic and production examples
"

# Push
git push
```

## 🎯 Quick Reference: Ordnerstruktur

Nach Setup sollte dein Construct-Ordner so aussehen:

```
my-construct-name/
├── README.md              ✅ Vollständig ausgefüllt
├── CHANGELOG.md           ✅ v1.0.0 Entry
├── package.json           ✅ Dependencies korrekt
├── tsconfig.json          ✅ TypeScript Config
├── jest.config.js         ✅ Test Config
├── src/
│   └── index.ts           ✅ Implementierung
├── test/
│   └── unit.test.ts       ✅ Tests (alle passing)
└── examples/
    ├── basic.ts           ✅ Minimal-Beispiel
    └── production.ts      ✅ Production-Beispiel
```

## 🆘 Troubleshooting

### Problem: "Cannot find module 'aws-cdk-lib'"
```bash
npm install
```

### Problem: TypeScript Compiler Errors
```bash
npm run build
# Fehler beheben in src/index.ts
```

### Problem: Tests schlagen fehl
```bash
npm test -- --verbose
# Schaue dir die detaillierten Fehler an
```

### Problem: CDK Synth funktioniert nicht
```bash
cd examples
cdk synth -a "npx ts-node basic.ts" --verbose
# Prüfe auf Import-Fehler oder Props-Validierung
```

## 📚 Weitere Ressourcen

- [CONTRIBUTING.md](../CONTRIBUTING.md) – Vollständige Contribution-Guidelines
- [Existing Construct](../primitives/storage/s3-bucket-secure/) – Referenz-Implementierung
- [AWS CDK Docs](https://docs.aws.amazon.com/cdk/v2/guide/) – Offizielle Dokumentation
- [CDK Patterns](https://cdkpatterns.com/) – Community Patterns

## ✅ Fertig!

Wenn alle Punkte der Checklist erfüllt sind, ist dein Construct **production-ready**! 🎉

Du kannst es jetzt in echten Projekten verwenden und anderen zur Verfügung stellen.

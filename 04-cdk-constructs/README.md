# 04-cdk-constructs – Enterprise-Grade CDK Constructs Library

> **Version:** 2.0.0 | **Phase 1 Complete** | **Status:** Production-Ready

Kurze, leicht konfigurierbare, domain-orientierte Bausteine ("Lego-Steine") mit sicheren, kostengünstigen Defaults.

## 🏗️ Architektur-Übersicht

```
04-cdk-constructs/
├── primitives/        # Einzelne AWS-Ressourcen mit Best-Practice Defaults
├── patterns/          # Multi-Service Kombinationen für Use-Cases
├── blueprints/        # Vollständige Starter-Templates (coming soon)
└── .construct-template/ # Scaffolding für neue Constructs
```

## 📦 Primitives (Basis-Bausteine)

### Compute
- (Geplant: lambda-function-secure, fargate-task-definition)

### Storage
- **s3-bucket-secure** – S3 Bucket mit Block Public Access, SSE, Logs optional

### Database
- (Geplant: dynamodb-table-standard, rds-postgres-dev)

### Networking
- **network-baseline** – VPC minimal, Gateway Endpoints, NAT-free Option

### Security
- **iam-role-lambda-basic** – Lambda Execution Role (Least Privilege)
- **kms-key-managed** – KMS Key mit optionaler Rotation

### Messaging
- **sqs-queue-encrypted** – SQS Queue mit SSE-KMS, DLQ optional
- **sns-topic-encrypted** – SNS Topic mit SSE-KMS

### Observability
- **log-group-short-retention** – CloudWatch Logs mit kurzer Retention

### CDN
- (Geplant: cloudfront-distribution-secure)

## 🎯 Patterns (Use-Case Kombinationen)

### API
- **http-api-lambda** – HTTP API + Lambda (+ DLQ/Alarms)

### Async
- **queue-worker** – SQS + Lambda Worker mit DLQ

### Web
- **static-site-cloudfront** – S3 (privat) + CloudFront (OAC)

### Data
- **dynamodb-table-streams** – DynamoDB mit Streams (PITR/TTL)
- **s3-bucket-lifecycle** – S3 mit Lifecycle & Logging

### Container
- (Geplant: ecs-fargate-service, eks-cluster-minimal)

### Governance
- **budget-alerts** – AWS Budgets + SNS Alerts (50/80/100%)

## Einheitliches README-Schema (alle Ordner)
- Zweck – 1 Zeile wozu der Baustein dient
- Wann verwenden – typische Szenarien
- Voraussetzungen – CDK v2, Node 18+, AWS CLI
- Einbindung – Ordner kopieren, im Stack instanziieren
- Beispiel (TypeScript) – 5–10 Zeilen, minimal
- Props (wichtigste) – 3–6 Kern-Properties
- Outputs – die wichtigsten Ausgaben (URLs/ARNs)
- Defaults – Sicherheits-/Kosten-Defaults kurz

## Nutzung (universell)
1) Neues CDK-Projekt (oder bestehendes nutzen)
   ```bash
   cdk init app --language typescript
   ```
2) Gewünschten Ordner aus 04-cdk-constructs in dein Projekt kopieren (z. B. src/constructs/<name>)
3) Construct importieren und mit minimalen Props instanziieren (siehe README je Ordner)
4) Deploy
   ```bash
   cdk synth && cdk deploy
   ```

## Standards (automatisch gesetzt)
- Security by default (Encryption, Block Public Access, Least Privilege)
- Kostenarm (kurze Log-Retention, NAT-freie Optionen, HTTP API wenn möglich)
- Beobachtbarkeit (Logs; Alarms optional)

## 🚀 Neues Construct erstellen

**Schnellstart:**
```bash
cd 04-cdk-constructs/{category}/{domain}/
mkdir my-construct && cd my-construct
cp ../../../.construct-template/README.template.md README.md
mkdir -p src test examples
```

**Vollständige Anleitung:** [CONTRIBUTING.md](CONTRIBUTING.md)

## 📚 Phase 1: Neue Features

### ✅ Abgeschlossen
- ✅ **Domain-Architektur:** primitives/ + patterns/ (nach AWS Service & Use-Case)
- ✅ **Template-System:** .construct-template/ für schnelles Scaffolding
- ✅ **CONTRIBUTING.md:** Standards, Checkliste, Versioning
- ✅ **Erweiterte READMEs:** Status, Version, Kosten, Dependencies, Beispiele
- ✅ **CHANGELOG.md:** Semantic Versioning pro Construct (coming soon)

### 🔸 Geplant (Phase 2)
- Unit-Tests (test/) für jeden Construct
- Vollständige Code-Beispiele (examples/)
- Blueprints (vollständige Starter-Stacks)
- Catalog-System (.catalog/index.json)

## 📝 Dokumentations-Qualität

Jedes Construct hat:
- ✅ Status-Badge (🟢 Stable | 🟡 Beta | 🔴 Experimental)
- ✅ Versionsnummer (Semantic Versioning)
- ✅ Kosten-Abschnitt (Free Tier, Typisch, Kostenfallen)
- ✅ Dependencies (intern dokumentiert)
- ✅ Quick Start (Copy-Paste Code)
- 🔸 CHANGELOG.md (folgt)
- 🔸 examples/ (folgt)
- 🔸 test/ (folgt)

## 🧑‍💻 Contribution Workflow

1. Kategorie wählen (primitives/patterns)
2. Domain wählen (compute, storage, api, async, ...)
3. Template kopieren
4. README ausfüllen
5. Code implementieren (src/)
6. Test schreiben (test/)
7. Beispiel erstellen (examples/)
8. CHANGELOG.md aktualisieren

**Details:** [CONTRIBUTING.md](CONTRIBUTING.md)

## 🎯 Related Resources

- [AWS Solutions Constructs](https://docs.aws.amazon.com/solutions/latest/constructs/) – Offizielle AWS Patterns
- [AWS CDK Patterns](https://cdkpatterns.com/) – Community Patterns
- [Construct Hub](https://constructs.dev/) – Public CDK Constructs

---

**Version:** 2.0.0 | **Phase 1 Complete** ✅ | **Maintainer:** @vitalij | **Issues:** GitHub Issues
